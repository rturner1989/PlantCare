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
end
