# frozen_string_literal: true

require 'test_helper'

# rubocop:disable Rails/SkipsModelValidations -- update_columns seeds calculated schedule values directly so tests don't have to round-trip through Plant#calculate_schedule
class PlantTest < ActiveSupport::TestCase
  include ActiveJob::TestHelper

  setup do
    @space = spaces(:living_room)
    @species = species(:monstera)
  end

  test 'valid plant' do
    plant = @space.plants.new(nickname: 'Test Plant', species: @species)
    assert plant.valid?
  end

  test 'requires nickname' do
    plant = @space.plants.new(nickname: '', species: @species)
    assert_not plant.valid?
    assert_includes plant.errors[:nickname], "can't be blank"
  end

  test 'calculates schedule on create when species is set' do
    plant = @space.plants.create!(nickname: 'New Plant', species: @species)

    assert plant.calculated_watering_days.present?
    assert plant.calculated_feeding_days.present?
  end

  test 'schedule uses species base frequency for average conditions' do
    @space.update!(light_level: 'medium', temperature_level: 'average', humidity_level: 'average')
    plant = @space.plants.create!(nickname: 'Average Plant', species: @species)

    assert_equal @species.watering_frequency_days, plant.calculated_watering_days
    assert_equal @species.feeding_frequency_days, plant.calculated_feeding_days
  end

  test 'bright and warm space reduces watering interval' do
    @space.update!(light_level: 'bright', temperature_level: 'warm', humidity_level: 'average')
    plant = @space.plants.create!(nickname: 'Sunny Plant', species: @species)

    assert plant.calculated_watering_days < @species.watering_frequency_days
  end

  test 'low light and cool space increases watering interval' do
    @space.update!(light_level: 'low', temperature_level: 'cool', humidity_level: 'average')
    plant = @space.plants.create!(nickname: 'Shady Plant', species: @species)

    assert plant.calculated_watering_days > @species.watering_frequency_days
  end

  test 'recalculates schedule when its space env changes' do
    @space.update!(light_level: 'medium', temperature_level: 'average', humidity_level: 'average')
    plant = @space.plants.create!(nickname: 'Test Plant', species: @species)
    original_days = plant.calculated_watering_days

    @space.update!(light_level: 'bright', temperature_level: 'warm')

    assert_not_equal original_days, plant.reload.calculated_watering_days
  end

  test 'recalculates schedule when plant moves to a different space' do
    @space.update!(light_level: 'medium', temperature_level: 'average', humidity_level: 'average')
    other_space = current_user.spaces.create!(
      name: 'Sunroom',
      category: 'indoor',
      light_level: 'bright',
      temperature_level: 'warm',
      humidity_level: 'dry'
    )

    plant = @space.plants.create!(nickname: 'Mover', species: @species)
    original_days = plant.calculated_watering_days

    plant.update!(space: other_space)

    assert_not_equal original_days, plant.calculated_watering_days
  end

  test 'does not recalculate when unrelated fields change' do
    plant = @space.plants.create!(nickname: 'Test Plant', species: @species)
    original_days = plant.calculated_watering_days

    plant.update!(nickname: 'Renamed Plant')

    assert_equal original_days, plant.calculated_watering_days
  end

  test 'water_status returns overdue when past due' do
    plant = plants(:wilty)
    assert_equal :overdue, plant.water_status
  end

  test 'water_status returns healthy when recently watered' do
    plant = plants(:sir_plantalot)
    assert_equal :healthy, plant.water_status
  end

  test 'water_status returns due_soon within 2 days' do
    plant = @space.plants.create!(
      nickname: 'Soon Plant',
      species: @species,
      calculated_watering_days: 7,
      last_watered_at: 6.days.ago
    )

    assert_equal :due_soon, plant.water_status
  end

  test 'water_status returns unknown without watering data' do
    plant = @space.plants.new(nickname: 'New Plant')
    assert_equal :unknown, plant.water_status
  end

  test 'feed_status returns overdue when past due' do
    plant = plants(:wilty)
    assert_equal :overdue, plant.feed_status
  end

  test 'days_until_water calculates correctly' do
    plant = plants(:sir_plantalot)
    assert_equal 4, plant.days_until_water
  end

  test 'species is optional' do
    plant = @space.plants.new(nickname: 'Mystery Plant')
    assert plant.valid?
  end

  test 'never calculates less than 1 day' do
    fast_species = Species.create!(common_name: 'Fast Fern', watering_frequency_days: 2, personality: 'needy')
    @space.update!(light_level: 'bright', temperature_level: 'warm', humidity_level: 'dry')
    plant = @space.plants.create!(nickname: 'Fast Plant', species: fast_species)

    assert plant.calculated_watering_days >= 1
  end

  test 'create unlocks first_plant achievement (idempotent across plants)' do
    user = User.create!(email: 'first-plant@test.com', name: 'FP', password: 'greenthumb99')
    space = user.spaces.create!(name: 'Office', light_level: 'medium', temperature_level: 'average', humidity_level: 'average')

    perform_enqueued_jobs do
      space.plants.create!(nickname: 'Number 1', species: @species)
    end
    assert_equal 1, user.achievements.where(kind: 'first_plant').count

    perform_enqueued_jobs do
      space.plants.create!(nickname: 'Number 2', species: @species)
    end
    assert_equal 1, user.achievements.where(kind: 'first_plant').count
  end

  test 'tasks_on returns water + feed tasks due on or before the date' do
    plant = @space.plants.create!(nickname: 'Wilty', species: @species, last_watered_at: 10.days.ago, last_fed_at: 60.days.ago)
    plant.update_columns(calculated_watering_days: 7, calculated_feeding_days: 30)

    tasks = plant.tasks_on(Date.current)
    kinds = tasks.pluck(:kind)
    assert_includes kinds, 'water'
    assert_includes kinds, 'feed'
  end

  test 'tasks_on returns empty array when nothing due yet' do
    plant = @space.plants.create!(nickname: 'Fresh', species: @species, last_watered_at: 1.hour.ago, last_fed_at: 1.hour.ago)
    plant.update_columns(calculated_watering_days: 7, calculated_feeding_days: 30)

    assert_empty plant.tasks_on(Date.current)
  end

  test 'tasks_on labels overdue with day count' do
    plant = @space.plants.create!(nickname: 'Late', species: @species, last_watered_at: 10.days.ago)
    plant.update_columns(calculated_watering_days: 7, calculated_feeding_days: nil, last_fed_at: nil)

    water_task = plant.tasks_on(Date.current).find { |task| task[:kind] == 'water' }
    assert_equal 'overdue', water_task[:due_state]
    assert_match(/days overdue/, water_task[:due_label])
  end

  test 'tasks_on labels due_today when due_on equals target date' do
    plant = @space.plants.create!(nickname: 'Right Time', species: @species, last_watered_at: 7.days.ago)
    plant.update_columns(calculated_watering_days: 7, calculated_feeding_days: nil, last_fed_at: nil)

    water_task = plant.tasks_on(Date.current).find { |task| task[:kind] == 'water' }
    assert_equal 'due_today', water_task[:due_state]
    assert_equal 'Due today', water_task[:due_label]
  end

  private def current_user
    @space.user
  end
end
# rubocop:enable Rails/SkipsModelValidations
