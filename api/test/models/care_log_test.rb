# frozen_string_literal: true

require 'test_helper'

class CareLogTest < ActiveSupport::TestCase
  setup do
    @plant = plants(:sir_plantalot)
  end

  test 'valid care log' do
    log = @plant.care_logs.new(care_type: 'watering', performed_at: Time.current)
    assert log.valid?
  end

  test 'requires care_type' do
    log = @plant.care_logs.new(performed_at: Time.current)
    assert_not log.valid?
    assert_includes log.errors[:care_type], "can't be blank"
  end

  test 'care_type must be watering or feeding' do
    log = @plant.care_logs.new(care_type: 'singing', performed_at: Time.current)
    assert_not log.valid?
    assert_includes log.errors[:care_type], 'is not included in the list'
  end

  test 'defaults performed_at to now when not specified' do
    log = @plant.care_logs.create!(care_type: 'watering')

    assert_in_delta Time.current, log.performed_at, 2.seconds
  end

  test 'watering log updates plant last_watered_at' do
    time = Time.current
    @plant.care_logs.create!(care_type: 'watering', performed_at: time)

    assert_in_delta time, @plant.reload.last_watered_at, 2.seconds
  end

  test 'feeding log updates plant last_fed_at' do
    time = Time.current
    @plant.care_logs.create!(care_type: 'feeding', performed_at: time)

    assert_in_delta time, @plant.reload.last_fed_at, 2.seconds
  end

  test 'chronological scope orders by performed_at descending' do
    logs = @plant.care_logs.chronological
    assert logs.first.performed_at > logs.last.performed_at
  end
end
