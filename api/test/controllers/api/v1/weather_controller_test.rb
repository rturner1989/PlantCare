# frozen_string_literal: true

require 'test_helper'

class Api::V1::WeatherControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:john)
    Rails.cache.clear
  end

  teardown do
    Api::V1::WeatherController.client_class = OpenMeteoClient
  end

  def stub_client(payload)
    Class.new do
      define_singleton_method(:forecast) { |**_kwargs| payload }
    end
  end

  test 'returns weather payload for the user location' do
    Api::V1::WeatherController.client_class = stub_client(
      today: { scheme: 'heat', icon: '☀', label: 'Clear', temperature: 22, detail: '22° · clear' },
      week: [{ date: '2026-05-02', scheme: 'heat', icon: '☀', label: 'Clear', temperature: 22 }]
    )

    get api_v1_weather_path, headers: auth_headers(@user), as: :json

    assert_response :ok
    json = response.parsed_body
    assert_equal 'Clear', json['today']['label']
    assert_equal 1, json['week'].length
    assert_kind_of String, json['location_label']
  end

  test 'returns 502 when upstream forecast is nil' do
    Api::V1::WeatherController.client_class = stub_client(nil)

    get api_v1_weather_path, headers: auth_headers(@user), as: :json

    assert_response :bad_gateway
  end

  test 'requires authentication' do
    get api_v1_weather_path, as: :json
    assert_response :unauthorized
  end
end
