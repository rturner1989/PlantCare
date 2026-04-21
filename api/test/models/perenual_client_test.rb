# frozen_string_literal: true

require 'test_helper'

class PerenualClientTest < ActiveSupport::TestCase
  setup do
    @client = PerenualClient.new
    Rails.cache.clear
  end

  teardown do
    Rails.cache.clear
  end

  def stubbed_client(&)
    stubs = Faraday::Adapter::Test::Stubs.new(&)
    connection = Faraday.new do |f|
      f.response :json
      f.response :raise_error
      f.adapter :test, stubs
    end
    [PerenualClient.new(connection: connection), stubs]
  end

  test 'build_species maps common fields' do
    data = {
      'id' => 123,
      'common_name' => 'Test Plant',
      'scientific_name' => ['Testus plantus'],
      'watering' => 'Average',
      'watering_general_benchmark' => { 'value' => '5-7', 'unit' => 'days' },
      'sunlight' => ['Part shade'],
      'growth_rate' => 'High',
      'care_level' => 'Low',
      'maintenance' => 'Low',
      'poisonous_to_pets' => true,
      'poisonous_to_humans' => false,
      'drought_tolerant' => false,
      'tropical' => false,
      'description' => 'A test plant.',
      'default_image' => { 'regular_url' => 'https://example.com/plant.jpg' },
      'hardiness' => { 'min' => '8', 'max' => '10' }
    }

    species = @client.build_species(data)

    assert_equal 'Test Plant', species.common_name
    assert_equal 'Testus plantus', species.scientific_name
    assert_equal 6, species.watering_frequency_days
    assert_equal 'bright_indirect', species.light_requirement
    assert_equal 'beginner', species.difficulty
    assert_equal 'Toxic to pets', species.toxicity
    assert_equal 'high', species.growth_rate
    assert_equal 'perenual', species.source
    assert_equal '123', species.external_id
    assert_equal 'https://example.com/plant.jpg', species.image_url
  end

  test 'build_species derives personality from maintenance and watering' do
    dramatic_data = base_data.merge('maintenance' => 'High', 'watering' => 'Frequent')
    assert_equal 'needy', @client.build_species(dramatic_data).personality

    chill_data = base_data.merge('maintenance' => 'Low', 'drought_tolerant' => true)
    assert_equal 'prickly', @client.build_species(chill_data).personality

    stoic_data = base_data.merge('drought_tolerant' => true)
    assert_equal 'stoic', @client.build_species(stoic_data).personality
  end

  test 'build_species falls back to watering string when no benchmark' do
    data = base_data.merge('watering_general_benchmark' => nil, 'watering' => 'Minimum')
    assert_equal 14, @client.build_species(data).watering_frequency_days
  end

  test 'build_species derives humidity from tropical flag' do
    tropical = base_data.merge('tropical' => true)
    assert_equal 'high', @client.build_species(tropical).humidity_preference

    temperate = base_data.merge('tropical' => false, 'watering' => 'Minimum')
    assert_equal 'low', @client.build_species(temperate).humidity_preference
  end

  test 'search caches the response so a second call with the same query skips Perenual' do
    call_count = 0
    client, stubs = stubbed_client do |stub|
      stub.get('species-list') do |_env|
        call_count += 1
        [200, { 'Content-Type' => 'application/json' }, { 'data' => [{ 'id' => 1, 'common_name' => 'Rose' }] }.to_json]
      end
    end

    first = client.search('rose')
    second = client.search('Rose ')

    assert_equal 1, call_count
    assert_equal first, second
    stubs.verify_stubbed_calls
  end

  test 'search does not cache Faraday errors so the next call retries the API' do
    call_count = 0
    client, _stubs = stubbed_client do |stub|
      stub.get('species-list') do |_env|
        call_count += 1
        [500, {}, 'boom']
      end
    end

    assert_empty client.search('rose')
    assert_empty client.search('rose')

    assert_equal 2, call_count
  end

  private def base_data
    {
      'id' => 999,
      'common_name' => 'Test',
      'scientific_name' => ['Test'],
      'watering' => 'Average',
      'watering_general_benchmark' => { 'value' => '7', 'unit' => 'days' },
      'sunlight' => ['Part shade'],
      'growth_rate' => 'Medium',
      'care_level' => 'Medium',
      'maintenance' => 'Medium',
      'poisonous_to_pets' => false,
      'poisonous_to_humans' => false,
      'drought_tolerant' => false,
      'tropical' => false,
      'description' => 'Test plant',
      'default_image' => nil,
      'hardiness' => { 'min' => '8', 'max' => '10' }
    }
  end
end
