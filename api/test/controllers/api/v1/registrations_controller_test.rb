# frozen_string_literal: true

require 'test_helper'

class Api::V1::RegistrationsControllerTest < ActionDispatch::IntegrationTest
  test 'register with valid params creates user and returns token' do
    post api_v1_registration_path, params: {
      user: { email: 'new@example.com', name: 'New User', password: 'password123', password_confirmation: 'password123' }
    }, as: :json

    assert_response :created
    json = response.parsed_body
    assert json['access_token'].present?
    assert json['user']['id'].present?
    assert_equal 'new@example.com', json['user']['email']
    assert_nil json['user']['password_digest']
  end

  test 'register with invalid params returns errors' do
    post api_v1_registration_path, params: {
      user: { email: '', name: '', password: 'short' }
    }, as: :json

    assert_response :unprocessable_entity
    json = response.parsed_body
    assert json['errors'].present?
  end

  test 'register with duplicate email returns error' do
    post api_v1_registration_path, params: {
      user: { email: 'john@doe.com', name: 'New', password: 'password123', password_confirmation: 'password123' }
    }, as: :json

    assert_response :unprocessable_entity
  end

  test 'register sets refresh token cookie' do
    post api_v1_registration_path, params: {
      user: { email: 'new@example.com', name: 'New User', password: 'password123', password_confirmation: 'password123' }
    }, as: :json

    assert_response :created
    assert cookies[:refresh_token].present?
  end
end
