# frozen_string_literal: true

require 'test_helper'

class Api::V1::Plants::CareLogsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:john)
    @plant = plants(:sir_plantalot)
  end

  test 'index returns care logs for plant' do
    get api_v1_plant_care_logs_path(@plant), headers: auth_headers(@user), as: :json

    assert_response :ok
    json = response.parsed_body
    assert_equal 2, json.length
  end

  test 'index orders chronologically descending' do
    get api_v1_plant_care_logs_path(@plant), headers: auth_headers(@user), as: :json

    json = response.parsed_body
    first_time = Time.zone.parse(json[0]['performed_at'])
    second_time = Time.zone.parse(json[1]['performed_at'])
    assert first_time > second_time
  end

  test 'index filters by care_type' do
    @plant.care_logs.create!(care_type: 'feeding', performed_at: 1.day.ago)

    get api_v1_plant_care_logs_path(@plant, care_type: 'feeding'), headers: auth_headers(@user), as: :json

    json = response.parsed_body
    assert(json.all? { |log| log['care_type'] == 'feeding' })
  end

  test 'index requires authentication' do
    get api_v1_plant_care_logs_path(@plant), as: :json

    assert_response :unauthorized
  end

  test 'cannot access other users plant care logs' do
    other = users(:jane)

    get api_v1_plant_care_logs_path(@plant), headers: auth_headers(other), as: :json

    assert_response :not_found
  end

  test 'create watering log' do
    assert_difference('CareLog.count', 1) do
      post api_v1_plant_care_logs_path(@plant), headers: auth_headers(@user),
        params: { care_log: { care_type: 'watering' } }, as: :json
    end

    assert_response :created
  end

  test 'create updates plant last_watered_at' do
    post api_v1_plant_care_logs_path(@plant), headers: auth_headers(@user),
      params: { care_log: { care_type: 'watering' } }, as: :json

    assert_in_delta Time.current, @plant.reload.last_watered_at, 2.seconds
  end

  test 'create feeding log updates last_fed_at' do
    post api_v1_plant_care_logs_path(@plant), headers: auth_headers(@user),
      params: { care_log: { care_type: 'feeding' } }, as: :json

    assert_in_delta Time.current, @plant.reload.last_fed_at, 2.seconds
  end

  test 'create with notes' do
    post api_v1_plant_care_logs_path(@plant), headers: auth_headers(@user),
      params: { care_log: { care_type: 'watering', notes: 'Extra water today' } }, as: :json

    assert_response :created
    json = response.parsed_body
    assert_equal 'Extra water today', json['notes']
  end

  test 'create with invalid care_type fails' do
    post api_v1_plant_care_logs_path(@plant), headers: auth_headers(@user),
      params: { care_log: { care_type: 'invalid' } }, as: :json

    assert_response :unprocessable_content
  end

  test 'cannot create on other users plant' do
    other = users(:jane)

    post api_v1_plant_care_logs_path(@plant), headers: auth_headers(other),
      params: { care_log: { care_type: 'watering' } }, as: :json

    assert_response :not_found
  end
end
