# frozen_string_literal: true

# == Schema Information
#
# Table name: plants
#
#  id                       :bigint           not null, primary key
#  acquired_at              :date
#  calculated_feeding_days  :integer
#  calculated_watering_days :integer
#  last_fed_at              :datetime
#  last_watered_at          :datetime
#  nickname                 :string           not null
#  notes                    :text
#  created_at               :datetime         not null
#  updated_at               :datetime         not null
#  space_id                 :bigint           not null
#  species_id               :bigint
#
# Indexes
#
#  index_plants_on_space_id    (space_id)
#  index_plants_on_species_id  (species_id)
#
# Foreign Keys
#
#  fk_rails_...  (space_id => spaces.id)
#  fk_rails_...  (species_id => species.id)
#
class Plant < ApplicationRecord
  belongs_to :space, counter_cache: true
  belongs_to :species, optional: true
  has_many :care_logs, dependent: :destroy
  has_many :plant_photos, dependent: :destroy

  validates :nickname, presence: true

  scope :in_space, ->(space_id) { where(space_id: space_id) if space_id.present? }

  before_save :calculate_schedule, if: :should_recalculate?
  before_create :set_initial_watered_at

  # Triggered by Space#after_update when env shifts — the space callback
  # iterates its plants and runs this. Bypasses `should_recalculate?`
  # which only watches Plant's own columns.
  def recalculate_schedule!
    calculate_schedule
    save!
  end

  def water_status
    return :unknown unless last_watered_at && calculated_watering_days

    days_until = days_until_water

    if days_until.negative?
      :overdue
    elsif days_until.zero?
      :due_today
    elsif days_until <= 2
      :due_soon
    else
      :healthy
    end
  end

  def feed_status
    return :unknown unless last_fed_at && calculated_feeding_days

    days_until = days_until_feed

    if days_until.negative?
      :overdue
    elsif days_until.zero?
      :due_today
    elsif days_until <= 3
      :due_soon
    else
      :healthy
    end
  end

  def days_until_water
    return nil unless last_watered_at && calculated_watering_days

    calculated_watering_days - days_since_watered
  end

  def days_until_feed
    return nil unless last_fed_at && calculated_feeding_days

    calculated_feeding_days - days_since_fed
  end

  def as_json(_options = {})
    {
      id: id,
      nickname: nickname,
      notes: notes,
      space: space.as_json,
      species: species&.as_json,
      calculated_watering_days: calculated_watering_days,
      calculated_feeding_days: calculated_feeding_days,
      water_status: water_status,
      feed_status: feed_status,
      days_until_water: days_until_water,
      days_until_feed: days_until_feed,
      last_watered_at: last_watered_at,
      last_fed_at: last_fed_at,
      acquired_at: acquired_at,
      created_at: created_at
    }
  end

  private def days_since_watered
    ((Time.current - last_watered_at) / 1.day).to_i
  end

  private def days_since_fed
    ((Time.current - last_fed_at) / 1.day).to_i
  end

  private def should_recalculate?
    species.present? && (
      new_record? ||
      species_id_changed? ||
      space_id_changed?
    )
  end

  private def set_initial_watered_at
    self.last_watered_at ||= Time.current
  end

  # Reads env from the plant's space — Space#after_update re-saves every
  # plant in the space when its env changes, so each plant runs through
  # this callback again with the fresh values.
  private def calculate_schedule
    return unless space

    modifier = 1.0 +
      Space::LIGHT_MODIFIERS.fetch(space.light_level, 0.0) +
      Space::TEMPERATURE_MODIFIERS.fetch(space.temperature_level, 0.0) +
      Space::HUMIDITY_MODIFIERS.fetch(space.humidity_level, 0.0)

    self.calculated_watering_days = [(species.watering_frequency_days * modifier).round, 1].max

    self.calculated_feeding_days = [(species.feeding_frequency_days * modifier).round, 1].max if species.feeding_frequency_days
  end
end
