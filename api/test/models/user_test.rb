# frozen_string_literal: true

require 'test_helper'

class UserTest < ActiveSupport::TestCase
  test 'valid user' do
    user = User.new(email: 'test@example.com', name: 'Test', password: 'greenthumb99',
                    password_confirmation: 'greenthumb99')
    assert user.valid?
  end

  test 'requires email' do
    user = User.new(name: 'Test', password: 'greenthumb99', password_confirmation: 'greenthumb99')
    assert_not user.valid?
    assert_includes user.errors[:email], "can't be blank"
  end

  test 'requires unique email' do
    User.create!(email: 'test@example.com', name: 'Test', password: 'greenthumb99', password_confirmation: 'greenthumb99')
    user = User.new(email: 'test@example.com', name: 'Test2', password: 'greenthumb99',
                    password_confirmation: 'greenthumb99')
    assert_not user.valid?
    assert_includes user.errors[:email], 'has already been taken'
  end

  test 'requires name' do
    user = User.new(email: 'test@example.com', password: 'greenthumb99', password_confirmation: 'greenthumb99')
    assert_not user.valid?
    assert_includes user.errors[:name], "can't be blank"
  end

  test 'requires password with minimum length' do
    user = User.new(email: 'test@example.com', name: 'Test', password: 'short', password_confirmation: 'short')
    assert_not user.valid?
    assert_includes user.errors[:password], 'is too short (minimum is 8 characters)'
  end

  test 'requires password to contain at least one letter' do
    user = User.new(email: 'test@example.com', name: 'Test', password: '12345678',
                    password_confirmation: '12345678')
    assert_not user.valid?
    assert_includes user.errors[:password], 'must contain at least one letter'
  end

  test 'requires password to contain at least one number' do
    user = User.new(email: 'test@example.com', name: 'Test', password: 'abcdefgh',
                    password_confirmation: 'abcdefgh')
    assert_not user.valid?
    assert_includes user.errors[:password], 'must contain at least one number'
  end

  test 'rejects passwords on the common-passwords blocklist' do
    user = User.new(email: 'test@example.com', name: 'Test', password: 'password123',
                    password_confirmation: 'password123')
    assert_not user.valid?
    assert_includes user.errors[:password], 'is too common — pick something less guessable'
  end

  test 'common-password check is case-insensitive' do
    user = User.new(email: 'test@example.com', name: 'Test', password: 'Password123',
                    password_confirmation: 'Password123')
    assert_not user.valid?
    assert_includes user.errors[:password], 'is too common — pick something less guessable'
  end

  test 'accepts a password that meets all rules' do
    user = User.new(email: 'test@example.com', name: 'Test', password: 'greenthumb99',
                    password_confirmation: 'greenthumb99')
    assert user.valid?
  end

  test 'downcases email before save' do
    user = User.create!(email: 'Test@Example.COM', name: 'Test', password: 'greenthumb99',
                        password_confirmation: 'greenthumb99')
    assert_equal 'test@example.com', user.email
  end
end
