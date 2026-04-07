# frozen_string_literal: true

require 'test_helper'

class Api::V1::TokensControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:john)
    @raw_token, @refresh_token = RefreshToken.generate(@user)
  end

  test 'refresh with valid token returns new access token' do
    cookies[:refresh_token] = @raw_token

    post api_v1_token_path, as: :json

    assert_response :ok
    json = response.parsed_body
    assert json['access_token'].present?
  end

  test 'refresh with revoked token returns unauthorized' do
    @refresh_token.revoke!
    cookies[:refresh_token] = @raw_token

    post api_v1_token_path, as: :json

    assert_response :unauthorized
  end

  test 'refresh with expired token returns unauthorized' do
    @refresh_token.update!(expires_at: 1.day.ago)
    cookies[:refresh_token] = @raw_token

    post api_v1_token_path, as: :json

    assert_response :unauthorized
  end

  test 'refresh without cookie returns unauthorized' do
    post api_v1_token_path, as: :json

    assert_response :unauthorized
  end
end
