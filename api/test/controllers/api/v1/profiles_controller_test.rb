# frozen_string_literal: true

require 'test_helper'

class Api::V1::ProfilesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:john)
  end

  test 'show requires authentication' do
    get api_v1_profile_path, as: :json

    assert_response :unauthorized
  end

  test 'show returns current user' do
    get api_v1_profile_path, headers: auth_headers(@user), as: :json

    assert_response :ok
    json = response.parsed_body
    assert_equal @user.email, json['email']
    assert_equal @user.name, json['name']
    assert_nil json['password_digest']
  end

  test 'update profile fields' do
    patch api_v1_profile_path, headers: auth_headers(@user),
      params: { user: { name: 'Updated Name', timezone: 'America/New_York' } }, as: :json

    assert_response :ok
    @user.reload
    assert_equal 'Updated Name', @user.name
    assert_equal 'America/New_York', @user.timezone
  end

  test 'update with invalid email returns error' do
    patch api_v1_profile_path, headers: auth_headers(@user),
      params: { user: { email: 'not-an-email' } }, as: :json

    assert_response :unprocessable_content
  end

  test 'update with duplicate email returns error' do
    patch api_v1_profile_path, headers: auth_headers(@user),
      params: { user: { email: 'jane@doe.com' } }, as: :json

    assert_response :unprocessable_content
  end

  test 'update onboarding_intent and onboarding_step_reached' do
    patch api_v1_profile_path, headers: auth_headers(@user),
      params: { user: { onboarding_intent: 'just_starting', onboarding_step_reached: 4 } }, as: :json

    assert_response :ok
    @user.reload
    assert_equal 'just_starting', @user.onboarding_intent
    assert_equal 4, @user.onboarding_step_reached
  end

  test 'update with invalid onboarding_intent returns 422' do
    patch api_v1_profile_path, headers: auth_headers(@user),
      params: { user: { onboarding_intent: 'garbage' } }, as: :json

    assert_response :unprocessable_content
    json = response.parsed_body
    assert_includes json['errors']['onboarding_intent'], 'is not included in the list'
  end

  test 'update persists latitude, longitude, and location_label' do
    patch api_v1_profile_path, headers: auth_headers(@user),
      params: { user: { latitude: 53.4808, longitude: -2.2426, location_label: 'Manchester' } }, as: :json

    assert_response :ok
    json = response.parsed_body
    assert_in_delta 53.4808, json['latitude'], 0.0001
    assert_in_delta(-2.2426, json['longitude'], 0.0001)
    assert_equal 'Manchester', json['location_label']
  end
end
