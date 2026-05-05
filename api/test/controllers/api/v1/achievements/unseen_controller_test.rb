# frozen_string_literal: true

require 'test_helper'

class Api::V1::Achievements::UnseenControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:john)
    Achievement.where(user: @user).destroy_all
  end

  test 'show returns splash-surface achievements with seen_at nil' do
    Achievement.create!(user: @user, kind: 'login_streak_7', earned_at: 1.minute.ago)
    Achievement.create!(user: @user, kind: 'first_plant', earned_at: 1.minute.ago)

    get api_v1_achievements_unseen_path, headers: auth_headers(@user), as: :json

    assert_response :ok
    kinds = response.parsed_body['achievements'].pluck('kind')
    assert_equal ['login_streak_7'], kinds
  end

  test 'show excludes already-seen splash achievements' do
    Achievement.create!(user: @user, kind: 'login_streak_7', earned_at: 1.minute.ago, seen_at: Time.current)

    get api_v1_achievements_unseen_path, headers: auth_headers(@user), as: :json

    assert_response :ok
    assert_equal 0, response.parsed_body['achievements'].length
  end

  test 'show requires authentication' do
    get api_v1_achievements_unseen_path, as: :json
    assert_response :unauthorized
  end

  test 'show scopes to current_user' do
    other = User.create!(email: 'other-unseen@test.com', name: 'Other', password: 'greenthumb99')
    Achievement.create!(user: other, kind: 'login_streak_7', earned_at: 1.minute.ago)

    get api_v1_achievements_unseen_path, headers: auth_headers(@user), as: :json

    assert_response :ok
    assert_equal 0, response.parsed_body['achievements'].length
  end
end
