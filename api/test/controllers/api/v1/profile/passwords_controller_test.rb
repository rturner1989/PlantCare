# frozen_string_literal: true

require 'test_helper'

class Api::V1::Profile::PasswordsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:john)
  end

  test 'update with correct current password' do
    patch api_v1_profile_password_path, headers: auth_headers(@user),
      params: { current_password: 'password123', user: { password: 'newpassword1', password_confirmation: 'newpassword1' } }, as: :json

    assert_response :ok
    assert @user.reload.authenticate('newpassword1')
  end

  test 'update with wrong current password fails' do
    patch api_v1_profile_password_path, headers: auth_headers(@user),
      params: { current_password: 'wrong', user: { password: 'newpassword1', password_confirmation: 'newpassword1' } }, as: :json

    assert_response :unprocessable_content
    json = response.parsed_body
    assert_equal 'Current password is incorrect', json['error']
  end

  test 'update with mismatched confirmation fails' do
    patch api_v1_profile_password_path, headers: auth_headers(@user),
      params: { current_password: 'password123', user: { password: 'newpassword1', password_confirmation: 'different' } }, as: :json

    assert_response :unprocessable_content
  end

  test 'update requires authentication' do
    patch api_v1_profile_password_path,
      params: { current_password: 'password123', user: { password: 'newpassword1', password_confirmation: 'newpassword1' } }, as: :json

    assert_response :unauthorized
  end
end
