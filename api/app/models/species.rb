# frozen_string_literal: true

# == Schema Information
#
# Table name: species
#
#  id                      :bigint           not null, primary key
#  care_tips               :text
#  common_name             :string           not null
#  description             :text
#  difficulty              :string
#  feeding_frequency_days  :integer
#  growth_rate             :string
#  humidity_preference     :string
#  image_url               :string
#  light_requirement       :string
#  personality             :string           default("chill"), not null
#  scientific_name         :string
#  source                  :string           default("seed"), not null
#  temperature_max         :decimal(4, 1)
#  temperature_min         :decimal(4, 1)
#  toxicity                :string
#  watering_frequency_days :integer          not null
#  created_at              :datetime         not null
#  updated_at              :datetime         not null
#  external_id             :string
#
# Indexes
#
#  index_species_on_common_name             (common_name)
#  index_species_on_scientific_name         (scientific_name)
#  index_species_on_source_and_external_id  (source,external_id) UNIQUE WHERE (external_id IS NOT NULL)
#
class Species < ApplicationRecord
  validates :common_name, presence: true
  validates :watering_frequency_days, presence: true, numericality: { greater_than: 0 }
  validates :personality, presence: true

  scope :search, ->(query) {
    where('common_name ILIKE :q OR scientific_name ILIKE :q', q: "%#{query}%")
  }

  def as_json(_options = {})
    {
      id: id,
      common_name: common_name,
      scientific_name: scientific_name,
      watering_frequency_days: watering_frequency_days,
      feeding_frequency_days: feeding_frequency_days,
      light_requirement: light_requirement,
      humidity_preference: humidity_preference,
      temperature_min: temperature_min,
      temperature_max: temperature_max,
      toxicity: toxicity,
      difficulty: difficulty,
      growth_rate: growth_rate,
      personality: personality,
      description: description,
      care_tips: care_tips,
      image_url: image_url
    }
  end
end
