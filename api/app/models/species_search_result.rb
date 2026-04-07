# frozen_string_literal: true

# Lightweight wrapper for Perenual API search results that haven't been cached yet.
# Renders the same JSON shape as Species#as_json but with minimal data.
class SpeciesSearchResult
  attr_reader :perenual_id
  attr_reader :common_name
  attr_reader :scientific_name
  attr_reader :image_url

  def initialize(api_data)
    @perenual_id = api_data['id']
    @common_name = api_data['common_name']
    @scientific_name = Array(api_data['scientific_name']).first
    @image_url = api_data.dig('default_image', 'regular_url')
  end

  def as_json(_options = {})
    {
      id: nil,
      perenual_id: perenual_id,
      common_name: common_name,
      scientific_name: scientific_name,
      image_url: image_url,
      source: 'perenual'
    }
  end
end
