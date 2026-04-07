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
end
