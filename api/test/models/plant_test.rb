# frozen_string_literal: true

require 'test_helper'

class PlantTest < ActiveSupport::TestCase
  setup do
    @room = rooms(:living_room)
    @species = species(:monstera)
  end

  test 'valid plant' do
    plant = @room.plants.new(nickname: 'Test Plant', species: @species)
    assert plant.valid?
  end

  test 'requires nickname' do
    plant = @room.plants.new(nickname: '', species: @species)
    assert_not plant.valid?
    assert_includes plant.errors[:nickname], "can't be blank"
  end

  test 'calculates schedule on create when species is set' do
    plant = @room.plants.create!(nickname: 'New Plant', species: @species)

    assert plant.calculated_watering_days.present?
    assert plant.calculated_feeding_days.present?
  end

  test 'schedule uses species base frequency for average conditions' do
    plant = @room.plants.create!(
      nickname: 'Average Plant',
      species: @species,
      light_level: 'medium',
      temperature_level: 'average',
      humidity_level: 'average'
    )

    assert_equal @species.watering_frequency_days, plant.calculated_watering_days
    assert_equal @species.feeding_frequency_days, plant.calculated_feeding_days
  end

  test 'bright and warm reduces watering interval' do
    plant = @room.plants.create!(
      nickname: 'Sunny Plant',
      species: @species,
      light_level: 'bright',
      temperature_level: 'warm',
      humidity_level: 'average'
    )

    assert plant.calculated_watering_days < @species.watering_frequency_days
  end

  test 'low light and cool increases watering interval' do
    plant = @room.plants.create!(
      nickname: 'Shady Plant',
      species: @species,
      light_level: 'low',
      temperature_level: 'cool',
      humidity_level: 'average'
    )

    assert plant.calculated_watering_days > @species.watering_frequency_days
  end

  test 'recalculates schedule when environment changes' do
    plant = @room.plants.create!(nickname: 'Test Plant', species: @species, light_level: 'medium')
    original_days = plant.calculated_watering_days

    plant.update!(light_level: 'bright', temperature_level: 'warm')

    assert_not_equal original_days, plant.calculated_watering_days
  end

  test 'does not recalculate when unrelated fields change' do
    plant = @room.plants.create!(nickname: 'Test Plant', species: @species)
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
    plant = @room.plants.create!(
      nickname: 'Soon Plant',
      species: @species,
      calculated_watering_days: 7,
      last_watered_at: 6.days.ago
    )

    assert_equal :due_soon, plant.water_status
  end

  test 'water_status returns unknown without watering data' do
    plant = @room.plants.new(nickname: 'New Plant')
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
    plant = @room.plants.new(nickname: 'Mystery Plant')
    assert plant.valid?
  end

  test 'never calculates less than 1 day' do
    fast_species = Species.create!(common_name: 'Fast Fern', watering_frequency_days: 2, personality: 'needy')
    plant = @room.plants.create!(
      nickname: 'Fast Plant',
      species: fast_species,
      light_level: 'bright',
      temperature_level: 'warm',
      humidity_level: 'dry'
    )

    assert plant.calculated_watering_days >= 1
  end
end
