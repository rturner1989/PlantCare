# frozen_string_literal: true

require 'test_helper'

class Api::V1::DashboardControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:john)
  end

  test 'requires authentication' do
    get api_v1_dashboard_path, as: :json

    assert_response :unauthorized
  end

  test 'returns stats for current user' do
    get api_v1_dashboard_path, headers: auth_headers(@user), as: :json

    assert_response :ok
    json = response.parsed_body
    assert_equal 3, json['stats']['total_plants']
    assert_equal 2, json['stats']['total_spaces']
  end

  test 'returns overdue plants in plants_needing_water' do
    get api_v1_dashboard_path, headers: auth_headers(@user), as: :json

    json = response.parsed_body
    nicknames = json['plants_needing_water'].pluck('nickname')
    assert_includes nicknames, 'Wilty'
  end

  test 'excludes healthy plants from plants_needing_water' do
    get api_v1_dashboard_path, headers: auth_headers(@user), as: :json

    json = response.parsed_body
    nicknames = json['plants_needing_water'].pluck('nickname')
    assert_not_includes nicknames, 'Sir Plantalot'
  end

  test 'returns overdue feeding plants' do
    get api_v1_dashboard_path, headers: auth_headers(@user), as: :json

    json = response.parsed_body
    nicknames = json['plants_needing_feeding'].pluck('nickname')
    assert_includes nicknames, 'Wilty'
  end

  test 'scopes to current user only' do
    other = users(:jane)

    get api_v1_dashboard_path, headers: auth_headers(other), as: :json

    json = response.parsed_body
    assert_equal 0, json['stats']['total_plants']
    assert_equal 1, json['stats']['total_spaces']
  end
end
