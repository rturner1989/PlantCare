# frozen_string_literal: true

require 'test_helper'

class Api::V1::PlantsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:john)
    @plant = plants(:sir_plantalot)
    @room = rooms(:living_room)
    @species = species(:monstera)
  end

  test 'index returns user plants' do
    get api_v1_plants_path, headers: auth_headers(@user), as: :json

    assert_response :ok
    json = response.parsed_body
    assert json.any? { |p| p['nickname'] == 'Sir Plantalot' }
  end

  test 'index filters by room' do
    get api_v1_plants_path(room_id: @room.id), headers: auth_headers(@user), as: :json

    json = response.parsed_body
    assert json.all? { |p| p['room']['id'] == @room.id }
  end

  test 'index excludes other users plants' do
    other = users(:jane)

    get api_v1_plants_path, headers: auth_headers(other), as: :json

    json = response.parsed_body
    assert_empty json
  end

  test 'index requires authentication' do
    get api_v1_plants_path, as: :json

    assert_response :unauthorized
  end

  test 'show returns plant with species and status' do
    get api_v1_plant_path(@plant), headers: auth_headers(@user), as: :json

    assert_response :ok
    json = response.parsed_body
    assert_equal 'Sir Plantalot', json['nickname']
    assert json['species'].present?
    assert json['water_status'].present?
  end

  test 'create with species calculates schedule automatically' do
    post api_v1_plants_path, headers: auth_headers(@user),
      params: {
        plant: {
          room_id: @room.id,
          species_id: @species.id,
          nickname: 'New Plant',
          light_level: 'bright',
          temperature_level: 'warm',
          humidity_level: 'average'
        }
      }, as: :json

    assert_response :created
    json = response.parsed_body
    assert json['calculated_watering_days'].present?
    assert json['calculated_watering_days'] < @species.watering_frequency_days
  end

  test 'create without species works' do
    post api_v1_plants_path, headers: auth_headers(@user),
      params: {
        plant: {
          room_id: @room.id,
          nickname: 'Mystery Plant'
        }
      }, as: :json

    assert_response :created
    json = response.parsed_body
    assert_equal 'Mystery Plant', json['nickname']
    assert_nil json['calculated_watering_days']
  end

  test 'create sets last_watered_at to now if not provided' do
    post api_v1_plants_path, headers: auth_headers(@user),
      params: {
        plant: {
          room_id: @room.id,
          species_id: @species.id,
          nickname: 'Fresh Plant'
        }
      }, as: :json

    assert_response :created
    json = response.parsed_body
    assert json['last_watered_at'].present?
  end

  test 'create with invalid room returns not found' do
    post api_v1_plants_path, headers: auth_headers(@user),
      params: { plant: { room_id: 999999, nickname: 'Lost Plant' } }, as: :json

    assert_response :not_found
  end

  test 'update plant' do
    patch api_v1_plant_path(@plant), headers: auth_headers(@user),
      params: { plant: { nickname: 'Sir Plantalot Jr' } }, as: :json

    assert_response :ok
    assert_equal 'Sir Plantalot Jr', @plant.reload.nickname
  end

  test 'update environment recalculates schedule' do
    original_days = @plant.calculated_watering_days

    patch api_v1_plant_path(@plant), headers: auth_headers(@user),
      params: { plant: { light_level: 'bright', temperature_level: 'warm' } }, as: :json

    assert_response :ok
    json = response.parsed_body
    assert_not_equal original_days, json['calculated_watering_days']
  end

  test 'destroy removes plant' do
    assert_difference('Plant.count', -1) do
      delete api_v1_plant_path(@plant), headers: auth_headers(@user), as: :json
    end

    assert_response :no_content
  end

  test 'cannot access other users plant' do
    other = users(:jane)

    get api_v1_plant_path(@plant), headers: auth_headers(other), as: :json

    assert_response :not_found
  end
end
