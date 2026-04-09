# frozen_string_literal: true

# == Schema Information
#
# Table name: care_logs
#
#  id           :bigint           not null, primary key
#  care_type    :string           not null
#  notes        :string
#  performed_at :datetime         not null
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  plant_id     :bigint           not null
#
# Indexes
#
#  index_care_logs_on_plant_id                   (plant_id)
#  index_care_logs_on_plant_id_and_performed_at  (plant_id,performed_at)
#
# Foreign Keys
#
#  fk_rails_...  (plant_id => plants.id)
#
class CareLog < ApplicationRecord
  CARE_TYPES = %w[watering feeding].freeze

  belongs_to :plant

  validates :care_type, presence: true, inclusion: { in: CARE_TYPES }
  validates :performed_at, presence: true

  before_validation :set_performed_at, on: :create
  after_create :update_plant_timestamps

  scope :chronological, -> { order(performed_at: :desc) }

  def as_json(_options = {})
    {
      id: id,
      care_type: care_type,
      performed_at: performed_at,
      notes: notes,
      created_at: created_at
    }
  end

  private def set_performed_at
    self.performed_at ||= Time.current
  end

  private def update_plant_timestamps
    case care_type
    when 'watering' then plant.update!(last_watered_at: performed_at)
    when 'feeding' then plant.update!(last_fed_at: performed_at)
    end
  end
end
