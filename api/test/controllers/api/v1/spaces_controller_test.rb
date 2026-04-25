# frozen_string_literal: true

require 'test_helper'

class Api::V1::SpacesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:john)
    @space = spaces(:living_room)
  end

  test 'index returns user spaces' do
    get api_v1_spaces_path,
      headers: auth_headers(@user),
      as: :json

    assert_response :ok
    json = response.parsed_body
    assert_equal 2, json.length
  end

  test 'index excludes other users spaces' do
    other = users(:jane)

    get api_v1_spaces_path,
      headers: auth_headers(other),
      as: :json

    json = response.parsed_body
    assert_equal 1, json.length
    assert_equal 'Kitchen', json[0]['name']
  end

  test 'index requires authentication' do
    get api_v1_spaces_path, as: :json

    assert_response :unauthorized
  end

  test 'show returns space' do
    get api_v1_space_path(@space),
      headers: auth_headers(@user),
      as: :json

    assert_response :ok
    json = response.parsed_body
    assert_equal 'Living Room', json['name']
  end

  test 'create with valid params' do
    post api_v1_spaces_path,
      headers: auth_headers(@user),
      params: { space: { name: 'Office', icon: 'desk' } },
      as: :json

    assert_response :created
    json = response.parsed_body
    assert_equal 'Office', json['name']
    assert_equal 'desk', json['icon']
  end

  test 'create with invalid params' do
    post api_v1_spaces_path,
      headers: auth_headers(@user),
      params: { space: { name: '' } },
      as: :json

    assert_response :unprocessable_entity
  end

  test 'update space' do
    patch api_v1_space_path(@space),
      headers: auth_headers(@user),
      params: { space: { name: 'Updated Space' } },
      as: :json

    assert_response :ok
    assert_equal 'Updated Space', @space.reload.name
  end

  test 'destroy space' do
    assert_difference('Space.count', -1) do
      delete api_v1_space_path(@space),
        headers: auth_headers(@user),
        as: :json
    end

    assert_response :no_content
  end

  test 'cannot access other users space' do
    users(:jane)
    other_space = spaces(:janes_kitchen)

    get api_v1_space_path(other_space),
      headers: auth_headers(@user),
      as: :json

    assert_response :not_found
  end
end
