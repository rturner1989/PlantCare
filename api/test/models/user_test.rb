# frozen_string_literal: true

require 'test_helper'

class UserTest < ActiveSupport::TestCase
  test 'valid user' do
    user = User.new(email: 'test@example.com', name: 'Test', password: 'password123',
                    password_confirmation: 'password123')
    assert user.valid?
  end

  test 'requires email' do
    user = User.new(name: 'Test', password: 'password123', password_confirmation: 'password123')
    assert_not user.valid?
    assert_includes user.errors[:email], "can't be blank"
  end

  test 'requires unique email' do
    User.create!(email: 'test@example.com', name: 'Test', password: 'password123', password_confirmation: 'password123')
    user = User.new(email: 'test@example.com', name: 'Test2', password: 'password123',
                    password_confirmation: 'password123')
    assert_not user.valid?
    assert_includes user.errors[:email], 'has already been taken'
  end

  test 'requires name' do
    user = User.new(email: 'test@example.com', password: 'password123', password_confirmation: 'password123')
    assert_not user.valid?
    assert_includes user.errors[:name], "can't be blank"
  end

  test 'requires password with minimum length' do
    user = User.new(email: 'test@example.com', name: 'Test', password: 'short', password_confirmation: 'short')
    assert_not user.valid?
    assert_includes user.errors[:password], 'is too short (minimum is 8 characters)'
  end

  test 'downcases email before save' do
    user = User.create!(email: 'Test@Example.COM', name: 'Test', password: 'password123',
                        password_confirmation: 'password123')
    assert_equal 'test@example.com', user.email
  end
end
