# frozen_string_literal: true

require 'test_helper'

class Api::V1::Onboarding::CompletionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:john)
  end

  test 'create marks the user as onboarded and returns the user' do
    assert_nil @user.onboarding_completed_at

    post api_v1_onboarding_completion_path,
      headers: auth_headers(@user),
      as: :json

    assert_response :created
    json = response.parsed_body
    assert_equal true, json['onboarded']
    assert_not_nil @user.reload.onboarding_completed_at
  end

  test 'create is idempotent — re-completing does not bump the timestamp' do
    @user.update!(onboarding_completed_at: 1.day.ago)
    original_timestamp = @user.onboarding_completed_at

    post api_v1_onboarding_completion_path,
      headers: auth_headers(@user),
      as: :json

    assert_response :created
    assert_in_delta original_timestamp.to_f, @user.reload.onboarding_completed_at.to_f, 0.001
  end

  test 'create requires authentication' do
    post api_v1_onboarding_completion_path, as: :json
    assert_response :unauthorized
  end
end
