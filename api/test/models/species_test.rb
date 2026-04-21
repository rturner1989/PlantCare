# frozen_string_literal: true

require 'test_helper'

class SpeciesTest < ActiveSupport::TestCase
  test 'valid species' do
    species = Species.new(common_name: 'Fern', watering_frequency_days: 3, personality: 'needy')
    assert species.valid?
  end

  test 'requires common_name' do
    species = Species.new(watering_frequency_days: 7)
    assert_not species.valid?
    assert_includes species.errors[:common_name], "can't be blank"
  end

  test 'requires watering_frequency_days' do
    species = Species.new(common_name: 'Fern')
    assert_not species.valid?
    assert_includes species.errors[:watering_frequency_days], "can't be blank"
  end

  test 'search finds by common name' do
    results = Species.search('monstera')
    assert_equal 1, results.length
    assert_equal 'Monstera Deliciosa', results.first.common_name
  end

  test 'search finds by scientific name' do
    results = Species.search('trifasciata')
    assert_equal 1, results.length
    assert_equal 'Snake Plant', results.first.common_name
  end

  test 'search is case insensitive' do
    results = Species.search('CACTUS')
    assert_equal 1, results.length
  end

  test 'search returns empty for no match' do
    results = Species.search('unicorn')
    assert_empty results
  end

  test 'popular scope returns only flagged species' do
    results = Species.popular
    assert_includes results.map(&:common_name), 'Monstera Deliciosa'
    assert_includes results.map(&:common_name), 'Snake Plant'
    assert_not_includes results.map(&:common_name), 'Cactus'
  end

  test 'popular defaults to false for new species' do
    species = Species.new(common_name: 'Orchid', watering_frequency_days: 7, personality: 'needy')
    assert_not species.popular
  end

  # suggested_light_level collapses the wider Species.light_requirement
  # enum onto Plant's three-way picker. Doubles as living docs for
  # which values land where.
  test 'suggested_light_level collapses direct and indirect bright species into "bright"' do
    assert_equal 'bright', Species.new(light_requirement: 'bright_direct').suggested_light_level
    assert_equal 'bright', Species.new(light_requirement: 'bright_indirect').suggested_light_level
  end

  test 'suggested_light_level maps low-light species to "low"' do
    assert_equal 'low', Species.new(light_requirement: 'low').suggested_light_level
  end

  test 'suggested_light_level maps tolerant ranges to "medium" for a neutral start' do
    assert_equal 'medium', Species.new(light_requirement: 'low_to_bright').suggested_light_level
    assert_equal 'medium', Species.new(light_requirement: 'low_to_bright_indirect').suggested_light_level
  end

  test 'suggested_light_level falls back to "medium" for unknown or missing values' do
    assert_equal 'medium', Species.new(light_requirement: 'wat').suggested_light_level
    assert_equal 'medium', Species.new(light_requirement: nil).suggested_light_level
  end

  test 'suggested_humidity_level maps high/low/average to humid/dry/average' do
    assert_equal 'humid', Species.new(humidity_preference: 'high').suggested_humidity_level
    assert_equal 'dry', Species.new(humidity_preference: 'low').suggested_humidity_level
    assert_equal 'average', Species.new(humidity_preference: 'average').suggested_humidity_level
  end

  test 'suggested_humidity_level falls back to "average" for unknown or missing values' do
    assert_equal 'average', Species.new(humidity_preference: 'wat').suggested_humidity_level
    assert_equal 'average', Species.new(humidity_preference: nil).suggested_humidity_level
  end

  test 'as_json includes suggested levels and plant_levels option arrays' do
    payload = species(:monstera).as_json

    assert_equal 'bright', payload[:suggested_light_level]
    assert_equal 'average', payload[:suggested_temperature_level]
    assert_equal 'humid', payload[:suggested_humidity_level]
    assert_equal Plant.level_options, payload[:plant_levels]
  end

  class StubClient
    def initialize(details_response: nil) = @details_response = details_response
    def details(_perenual_id) = @details_response
  end

  test 'find_or_fetch_from_api returns the persisted row when one already exists' do
    existing = Species.create!(common_name: 'Persistent', watering_frequency_days: 7, personality: 'chill',
                               source: 'perenual', external_id: '888')

    result = Species.find_or_fetch_from_api('888', client: StubClient.new,
                                            fallback: { common_name: 'IGNORED' })

    assert_equal existing.id, result.id
    assert_equal 'Persistent', result.common_name
  end

  test 'find_or_fetch_from_api falls back to search-summary fields when details are unavailable' do
    species = Species.find_or_fetch_from_api('999999',
      client: StubClient.new(details_response: nil),
      fallback: {
        common_name: 'Gardenia',
        scientific_name: 'Gardenia jasminoides',
        image_url: 'https://example.com/g.jpg'
      })

    assert_predicate species, :persisted?
    assert_equal 'Gardenia', species.common_name
    assert_equal 'Gardenia jasminoides', species.scientific_name
    assert_equal 'perenual', species.source
    assert_equal '999999', species.external_id
    assert_equal 7, species.watering_frequency_days
    assert_equal 'chill', species.personality
  end

  test 'find_or_fetch_from_api returns nil when details fail and no fallback is given' do
    assert_nil Species.find_or_fetch_from_api('999998', client: StubClient.new(details_response: nil))
  end
end
