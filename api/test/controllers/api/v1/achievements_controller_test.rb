# frozen_string_literal: true

require 'test_helper'

class Api::V1::AchievementsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:john)
    Achievement.where(user: @user).destroy_all
  end

  test 'index returns recent achievements ordered desc' do
    older = Achievement.create!(user: @user, kind: 'first_plant', earned_at: 5.days.ago)
    newer = Achievement.create!(user: @user, kind: 'care_streak_7', earned_at: 1.hour.ago)

    get api_v1_achievements_path, headers: auth_headers(@user), as: :json

    assert_response :ok
    json = response.parsed_body
    ids = json['achievements'].pluck('id')
    assert_equal [newer.id, older.id], ids
  end

  test 'index excludes other users achievements' do
    other = users(:jane) || User.create!(email: 'other@test.com', name: 'Other', password: 'greenthumb99')
    Achievement.create!(user: other, kind: 'first_plant', earned_at: Time.current)

    get api_v1_achievements_path, headers: auth_headers(@user), as: :json

    assert_response :ok
    json = response.parsed_body
    assert_equal 0, json['achievements'].length
  end

  test 'index requires authentication' do
    get api_v1_achievements_path, as: :json
    assert_response :unauthorized
  end

  test 'update marks the achievement as seen' do
    achievement = Achievement.create!(user: @user, kind: 'login_streak_7', earned_at: 1.minute.ago)

    patch api_v1_achievement_path(achievement), headers: auth_headers(@user), as: :json

    assert_response :ok
    assert_not_nil achievement.reload.seen_at
  end

  test 'update is idempotent — re-marking a seen achievement leaves seen_at unchanged' do
    timestamp = 1.day.ago
    achievement = Achievement.create!(user: @user, kind: 'login_streak_7', earned_at: 2.days.ago, seen_at: timestamp)

    patch api_v1_achievement_path(achievement), headers: auth_headers(@user), as: :json

    assert_response :ok
    assert_in_delta timestamp.to_f, achievement.reload.seen_at.to_f, 0.001
  end

  test 'update scopes to current_user — cannot mark another users achievement' do
    other = User.create!(email: 'other-seen@test.com', name: 'Other', password: 'greenthumb99')
    achievement = Achievement.create!(user: other, kind: 'login_streak_7', earned_at: 1.minute.ago)

    patch api_v1_achievement_path(achievement), headers: auth_headers(@user), as: :json
    assert_response :not_found
  end
end
