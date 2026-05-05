# frozen_string_literal: true

require 'test_helper'

class OpenMeteoClientTest < ActiveSupport::TestCase
  def stub_connection(body)
    Faraday.new do |f|
      f.response :json, content_type: 'application/json'
      f.adapter :test do |stub|
        stub.get('forecast') { [200, { 'Content-Type' => 'application/json' }, body] }
      end
    end
  end

  def daily_body(weather_codes:, highs:, mins: nil, precip_prob: nil, precip_sum: nil, times: nil, current_code: 0, current_temp: 22.0)
    times ||= weather_codes.each_index.map { |i| (Date.current + i).to_s }
    {
      'current' => { 'temperature_2m' => current_temp, 'weather_code' => current_code },
      'daily' => {
        'time' => times,
        'weather_code' => weather_codes,
        'temperature_2m_max' => highs,
        'temperature_2m_min' => mins || highs.map { |h| h - 6 },
        'precipitation_sum' => precip_sum || Array.new(weather_codes.length, 0),
        'precipitation_probability_max' => precip_prob || Array.new(weather_codes.length, 0)
      }
    }
  end

  test 'forecast maps current weather + 7-day daily payload' do
    body = daily_body(weather_codes: [0, 3, 61], highs: [22, 19, 14])

    client = OpenMeteoClient.new(connection: stub_connection(body.to_json))
    forecast = client.forecast(latitude: 51.48, longitude: -0.0)

    assert_equal 'Clear', forecast[:today][:label]
    assert_equal 'heat', forecast[:today][:scheme]
    assert_equal 22, forecast[:today][:temperature]

    assert_equal 3, forecast[:week].length
    assert_equal 'Light rain', forecast[:week][2][:label]
    assert_equal 'sky', forecast[:week][2][:scheme]
    assert_equal 14, forecast[:week][2][:temperature]
  end

  test 'today payload exposes overnight_low + next_day + rain_probability' do
    body = daily_body(weather_codes: [0, 61], highs: [22, 18], mins: [15, 13], precip_prob: [10, 80])

    client = OpenMeteoClient.new(connection: stub_connection(body.to_json))
    today = client.forecast(latitude: 0, longitude: 0)[:today]

    assert_equal 15, today[:overnight_low]
    assert_equal 10, today[:rain_probability]
    assert_equal 'Light rain', today[:next_day][:label]
    assert_equal 18, today[:next_day][:temperature]
    assert_equal 80, today[:next_day][:rain_probability]
  end

  test 'advice line: rain probability >= 60 → skip outdoor watering' do
    body = daily_body(weather_codes: [61], highs: [16], precip_prob: [85])

    client = OpenMeteoClient.new(connection: stub_connection(body.to_json))
    advice = client.forecast(latitude: 0, longitude: 0)[:today][:advice]

    assert_match(/Rain forecast/, advice)
  end

  test 'advice line: bright + warm → plants need help' do
    body = daily_body(weather_codes: [0], highs: [22], precip_prob: [5], current_code: 0, current_temp: 22.0)

    client = OpenMeteoClient.new(connection: stub_connection(body.to_json))
    advice = client.forecast(latitude: 0, longitude: 0)[:today][:advice]

    assert_match(/Bright day/, advice)
  end

  test 'advice line: hot day → check moisture twice' do
    body = daily_body(weather_codes: [0], highs: [30], precip_prob: [0])

    client = OpenMeteoClient.new(connection: stub_connection(body.to_json))
    advice = client.forecast(latitude: 0, longitude: 0)[:today][:advice]

    assert_match(/Hot day/, advice)
  end

  test 'advice line: cold day → bring tender plants in' do
    body = daily_body(weather_codes: [3], highs: [3], precip_prob: [0])

    client = OpenMeteoClient.new(connection: stub_connection(body.to_json))
    advice = client.forecast(latitude: 0, longitude: 0)[:today][:advice]

    assert_match(/Cold day/, advice)
  end

  test 'forecast returns nil + logs when upstream errors' do
    failing = Faraday.new do |f|
      f.adapter :test do |stub|
        stub.get('forecast') { [500, {}, ''] }
      end
      f.response :raise_error
    end

    client = OpenMeteoClient.new(connection: failing)
    assert_nil client.forecast(latitude: 0, longitude: 0)
  end

  test 'unknown weather_code falls back to UNKNOWN_CODE label' do
    body = {
      'current' => { 'temperature_2m' => 18.0, 'weather_code' => 999 },
      'daily' => { 'time' => [], 'weather_code' => [], 'temperature_2m_max' => [], 'temperature_2m_min' => [],
                   'precipitation_sum' => [], 'precipitation_probability_max' => [] }
    }
    client = OpenMeteoClient.new(connection: stub_connection(body.to_json))
    forecast = client.forecast(latitude: 0, longitude: 0)
    assert_equal 'Unknown', forecast[:today][:label]
  end
end
