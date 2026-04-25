# frozen_string_literal: true

require 'test_helper'

class SpaceTest < ActiveSupport::TestCase
  setup do
    @user = users(:john)
  end

  test 'valid space' do
    space = @user.spaces.new(name: 'Conservatory')
    assert space.valid?
  end

  test 'requires name' do
    space = @user.spaces.new(name: '')
    assert_not space.valid?
    assert_includes space.errors[:name], "can't be blank"
  end

  test 'requires user' do
    space = Space.new(name: 'Living Room')
    assert_not space.valid?
  end

  test 'accepts icon from the allowed set' do
    Space::ICONS.each_with_index do |icon, i|
      space = @user.spaces.new(name: "Space #{i}", icon: icon)
      assert space.valid?, "expected #{icon} to be a valid icon"
    end
  end

  test 'rejects unknown icon' do
    space = @user.spaces.new(name: 'Any', icon: 'spaceship')
    assert_not space.valid?
    assert_includes space.errors[:icon], 'is not included in the list'
  end

  test 'allows blank icon' do
    space = @user.spaces.new(name: 'Any', icon: nil)
    assert space.valid?
  end

  test 'name must be unique per user (case-insensitive)' do
    duplicate = @user.spaces.new(name: 'Living Room')
    assert_not duplicate.valid?
    assert_includes duplicate.errors[:name], 'has already been taken'

    different_case = @user.spaces.new(name: 'living room')
    assert_not different_case.valid?
    assert_includes different_case.errors[:name], 'has already been taken'
  end

  test 'same name allowed for different users' do
    # john's fixture has a Living Room; jane should still be able to name
    # one "Living Room" for herself.
    other_space = users(:jane).spaces.new(name: 'Living Room')
    assert other_space.valid?
  end

  test 'PRESETS only reference allowed icons' do
    Space::PRESETS.each do |preset|
      assert_includes Space::ICONS, preset[:icon]
    end
  end
end
