# frozen_string_literal: true

require 'test_helper'

class Api::V1::RoomsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:john)
    @room = rooms(:living_room)
  end

  test 'index returns user rooms' do
    get api_v1_rooms_path,
      headers: auth_headers(@user),
      as: :json

    assert_response :ok
    json = response.parsed_body
    assert_equal 2, json.length
  end

  test 'index excludes other users rooms' do
    other = users(:jane)

    get api_v1_rooms_path,
      headers: auth_headers(other),
      as: :json

    json = response.parsed_body
    assert_equal 1, json.length
    assert_equal 'Kitchen', json[0]['name']
  end

  test 'index requires authentication' do
    get api_v1_rooms_path, as: :json

    assert_response :unauthorized
  end

  test 'show returns room' do
    get api_v1_room_path(@room),
      headers: auth_headers(@user),
      as: :json

    assert_response :ok
    json = response.parsed_body
    assert_equal 'Living Room', json['name']
  end

  test 'create with valid params' do
    post api_v1_rooms_path,
      headers: auth_headers(@user),
      params: { room: { name: 'Office', icon: 'desk' } },
      as: :json

    assert_response :created
    json = response.parsed_body
    assert_equal 'Office', json['name']
    assert_equal 'desk', json['icon']
  end

  test 'create with invalid params' do
    post api_v1_rooms_path,
      headers: auth_headers(@user),
      params: { room: { name: '' } },
      as: :json

    assert_response :unprocessable_entity
  end

  test 'update room' do
    patch api_v1_room_path(@room),
      headers: auth_headers(@user),
      params: { room: { name: 'Updated Room' } },
      as: :json

    assert_response :ok
    assert_equal 'Updated Room', @room.reload.name
  end

  test 'destroy room' do
    assert_difference('Room.count', -1) do
      delete api_v1_room_path(@room),
        headers: auth_headers(@user),
        as: :json
    end

    assert_response :no_content
  end

  test 'cannot access other users room' do
    users(:jane)
    other_room = rooms(:janes_kitchen)

    get api_v1_room_path(other_room),
      headers: auth_headers(@user),
      as: :json

    assert_response :not_found
  end
end
