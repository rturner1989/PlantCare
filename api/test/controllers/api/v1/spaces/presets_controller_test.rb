# frozen_string_literal: true

require 'test_helper'

class Api::V1::Spaces::PresetsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:john)
  end

  test 'index returns the preset list' do
    get api_v1_spaces_presets_path,
      headers: auth_headers(@user),
      as: :json

    assert_response :ok
    json = response.parsed_body
    assert_equal Space::PRESETS.length, json.length
    assert_equal Space::PRESETS.first[:name], json.first['name']
    assert_equal Space::PRESETS.first[:icon], json.first['icon']
  end

  test 'index requires authentication' do
    get api_v1_spaces_presets_path, as: :json

    assert_response :unauthorized
  end
end
