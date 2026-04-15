# frozen_string_literal: true

require 'test_helper'

class RoomTest < ActiveSupport::TestCase
  setup do
    @user = users(:john)
  end

  test 'valid room' do
    room = @user.rooms.new(name: 'Living Room')
    assert room.valid?
  end

  test 'requires name' do
    room = @user.rooms.new(name: '')
    assert_not room.valid?
    assert_includes room.errors[:name], "can't be blank"
  end

  test 'requires user' do
    room = Room.new(name: 'Living Room')
    assert_not room.valid?
  end

  test 'accepts icon from the allowed set' do
    Room::ICONS.each do |icon|
      room = @user.rooms.new(name: 'Any', icon: icon)
      assert room.valid?, "expected #{icon} to be a valid icon"
    end
  end

  test 'rejects unknown icon' do
    room = @user.rooms.new(name: 'Any', icon: 'spaceship')
    assert_not room.valid?
    assert_includes room.errors[:icon], 'is not included in the list'
  end

  test 'allows blank icon' do
    room = @user.rooms.new(name: 'Any', icon: nil)
    assert room.valid?
  end

  test 'PRESETS only reference allowed icons' do
    Room::PRESETS.each do |preset|
      assert_includes Room::ICONS, preset[:icon]
    end
  end
end
