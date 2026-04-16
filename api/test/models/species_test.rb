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
end
