# frozen_string_literal: true

require 'test_helper'

class Api::V1::PlantsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:john)
    @plant = plants(:sir_plantalot)
    @space = spaces(:living_room)
    @species = species(:monstera)
  end

  test 'index returns user plants' do
    get api_v1_plants_path, headers: auth_headers(@user), as: :json

    assert_response :ok
    json = response.parsed_body
    assert(json.any? { |p| p['nickname'] == 'Sir Plantalot' })
  end

  test 'index filters by space' do
    get api_v1_plants_path(space_id: @space.id), headers: auth_headers(@user), as: :json

    json = response.parsed_body
    assert(json.all? { |p| p['space']['id'] == @space.id })
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

  test 'create with species calculates schedule from space env' do
    @space.update!(light_level: 'bright', temperature_level: 'warm', humidity_level: 'average')

    post api_v1_plants_path, headers: auth_headers(@user),
      params: {
        plant: {
          space_id: @space.id,
          species_id: @species.id,
          nickname: 'New Plant'
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
          space_id: @space.id,
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
          space_id: @space.id,
          species_id: @species.id,
          nickname: 'Fresh Plant'
        }
      }, as: :json

    assert_response :created
    json = response.parsed_body
    assert json['last_watered_at'].present?
  end

  test 'create accepts client-provided last_watered_at + last_fed_at' do
    watered = 3.days.ago.iso8601
    fed = 10.days.ago.iso8601

    post api_v1_plants_path, headers: auth_headers(@user),
      params: {
        plant: {
          space_id: @space.id,
          species_id: @species.id,
          nickname: 'Anchored Plant',
          last_watered_at: watered,
          last_fed_at: fed
        }
      }, as: :json

    assert_response :created
    json = response.parsed_body
    assert_in_delta Time.zone.parse(watered).to_i, Time.zone.parse(json['last_watered_at']).to_i, 1
    assert_in_delta Time.zone.parse(fed).to_i, Time.zone.parse(json['last_fed_at']).to_i, 1
  end

  test 'create rejects future-dated last_watered_at' do
    post api_v1_plants_path, headers: auth_headers(@user),
      params: {
        plant: {
          space_id: @space.id,
          species_id: @species.id,
          nickname: 'Time Traveller',
          last_watered_at: 1.day.from_now.iso8601
        }
      }, as: :json

    assert_response :unprocessable_content
    assert response.parsed_body['errors']['last_watered_at'].present?
  end

  test 'create rejects last_watered_at older than 12 months' do
    post api_v1_plants_path, headers: auth_headers(@user),
      params: {
        plant: {
          space_id: @space.id,
          species_id: @species.id,
          nickname: 'Ancient Plant',
          last_watered_at: 13.months.ago.iso8601
        }
      }, as: :json

    assert_response :unprocessable_content
    assert response.parsed_body['errors']['last_watered_at'].present?
  end

  test 'create accepts nil last_fed_at for non-feeding species' do
    air_plant = species(:air_plant)

    post api_v1_plants_path, headers: auth_headers(@user),
      params: {
        plant: {
          space_id: @space.id,
          species_id: air_plant.id,
          nickname: 'Tilly',
          last_watered_at: 1.day.ago.iso8601
          # no last_fed_at — air_plant has no feeding cycle
        }
      }, as: :json

    assert_response :created
    json = response.parsed_body
    assert_nil json['last_fed_at']
  end

  test 'create with invalid space returns not found' do
    post api_v1_plants_path, headers: auth_headers(@user),
      params: { plant: { space_id: 999_999, nickname: 'Lost Plant' } }, as: :json

    assert_response :not_found
  end

  test 'update plant' do
    patch api_v1_plant_path(@plant), headers: auth_headers(@user),
      params: { plant: { nickname: 'Sir Plantalot Jr' } }, as: :json

    assert_response :ok
    assert_equal 'Sir Plantalot Jr', @plant.reload.nickname
  end

  test 'updating space env recalculates schedules of plants in that space' do
    original_days = @plant.calculated_watering_days

    patch api_v1_space_path(@space), headers: auth_headers(@user),
      params: { space: { light_level: 'bright', temperature_level: 'warm' } }, as: :json

    assert_response :ok
    assert_not_equal original_days, @plant.reload.calculated_watering_days
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
