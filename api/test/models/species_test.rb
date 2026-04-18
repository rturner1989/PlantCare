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
end
