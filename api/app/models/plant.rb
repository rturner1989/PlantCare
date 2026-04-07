# frozen_string_literal: true

# == Schema Information
#
# Table name: plants
#
#  id                       :bigint           not null, primary key
#  acquired_at              :date
#  calculated_feeding_days  :integer
#  calculated_watering_days :integer
#  humidity_level           :string           default("average"), not null
#  last_fed_at              :datetime
#  last_watered_at          :datetime
#  light_level              :string           default("medium"), not null
#  nickname                 :string           not null
#  notes                    :text
#  temperature_level        :string           default("average"), not null
#  created_at               :datetime         not null
#  updated_at               :datetime         not null
#  room_id                  :bigint           not null
#  species_id               :bigint
#
# Indexes
#
#  index_plants_on_room_id     (room_id)
#  index_plants_on_species_id  (species_id)
#
# Foreign Keys
#
#  fk_rails_...  (room_id => rooms.id)
#  fk_rails_...  (species_id => species.id)
#
class Plant < ApplicationRecord
  LIGHT_MODIFIERS = { 'bright' => -0.15, 'medium' => 0.0, 'low' => 0.2 }.freeze
  TEMPERATURE_MODIFIERS = { 'warm' => -0.1, 'average' => 0.0, 'cool' => 0.15 }.freeze
  HUMIDITY_MODIFIERS = { 'dry' => -0.1, 'average' => 0.0, 'humid' => 0.15 }.freeze

  belongs_to :room, counter_cache: true
  belongs_to :species, optional: true

  validates :nickname, presence: true
  validates :light_level, inclusion: { in: LIGHT_MODIFIERS.keys }
  validates :temperature_level, inclusion: { in: TEMPERATURE_MODIFIERS.keys }
  validates :humidity_level, inclusion: { in: HUMIDITY_MODIFIERS.keys }

  before_save :calculate_schedule, if: :should_recalculate?
  before_create :set_initial_watered_at

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
      room: room.as_json,
      species: species&.as_json,
      light_level: light_level,
      temperature_level: temperature_level,
      humidity_level: humidity_level,
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
      light_level_changed? ||
      temperature_level_changed? ||
      humidity_level_changed? ||
      species_id_changed?
    )
  end

  private def set_initial_watered_at
    self.last_watered_at ||= Time.current
  end

  private def calculate_schedule
    modifier = 1.0 +
      LIGHT_MODIFIERS.fetch(light_level, 0.0) +
      TEMPERATURE_MODIFIERS.fetch(temperature_level, 0.0) +
      HUMIDITY_MODIFIERS.fetch(humidity_level, 0.0)

    self.calculated_watering_days = [(species.watering_frequency_days * modifier).round, 1].max

    self.calculated_feeding_days = [(species.feeding_frequency_days * modifier).round, 1].max if species.feeding_frequency_days
  end
end
