# frozen_string_literal: true

require 'test_helper'

class Api::V1::SpeciesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:john)
  end

  test 'index returns matching local species' do
    get api_v1_species_index_path(q: 'monstera'), headers: auth_headers(@user), as: :json

    assert_response :ok
    json = response.parsed_body
    assert(json.any? { |s| s['common_name'] == 'Monstera Deliciosa' })
  end

  test 'index returns empty for blank query' do
    get api_v1_species_index_path(q: ''), headers: auth_headers(@user), as: :json

    assert_response :ok
    json = response.parsed_body
    assert_empty json
  end

  test 'index requires authentication' do
    get api_v1_species_index_path(q: 'monstera'), as: :json

    assert_response :unauthorized
  end

  test 'show returns species detail' do
    species = species(:monstera)

    get api_v1_species_path(species), headers: auth_headers(@user), as: :json

    assert_response :ok
    json = response.parsed_body
    assert_equal 'Monstera Deliciosa', json['common_name']
    assert_equal 'dramatic', json['personality']
  end

  test 'show returns not found for invalid id' do
    get api_v1_species_path(id: 999_999), headers: auth_headers(@user), as: :json

    assert_response :not_found
  end
end
