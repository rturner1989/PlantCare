# frozen_string_literal: true

# == Schema Information
#
# Table name: spaces
#
#  id           :bigint           not null, primary key
#  archived_at  :datetime
#  category     :string           default("indoor"), not null
#  icon         :string
#  name         :string           not null
#  plants_count :integer          default(0), not null
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  user_id      :bigint           not null
#
# Indexes
#
#  index_spaces_on_user_id                  (user_id)
#  index_spaces_on_user_id_and_archived_at  (user_id,archived_at)
#  index_spaces_on_user_id_and_lower_name   (user_id, lower((name)::text)) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
class Space < ApplicationRecord
  ICONS = %w[couch kitchen bed bath desk hallway study conservatory patio balcony garden_bed greenhouse].freeze

  CATEGORY_LABELS = {
    indoor: 'Indoor',
    outdoor: 'Outdoor'
  }.freeze

  enum :category, CATEGORY_LABELS.keys.index_with(&:to_s)

  PRESETS = [
    { name: 'Living Room', icon: 'couch', category: 'indoor' },
    { name: 'Kitchen', icon: 'kitchen', category: 'indoor' },
    { name: 'Bedroom', icon: 'bed', category: 'indoor' },
    { name: 'Bathroom', icon: 'bath', category: 'indoor' },
    { name: 'Office', icon: 'desk', category: 'indoor' },
    { name: 'Hallway', icon: 'hallway', category: 'indoor' },
    { name: 'Study', icon: 'study', category: 'indoor' },
    { name: 'Conservatory', icon: 'conservatory', category: 'indoor' },
    { name: 'Patio', icon: 'patio', category: 'outdoor' },
    { name: 'Balcony', icon: 'balcony', category: 'outdoor' },
    { name: 'Garden bed', icon: 'garden_bed', category: 'outdoor' },
    { name: 'Greenhouse', icon: 'greenhouse', category: 'outdoor' }
  ].freeze

  belongs_to :user
  has_many :plants, dependent: :destroy

  validates :name, presence: true, uniqueness: { scope: :user_id, case_sensitive: false }
  validates :icon, inclusion: { in: ICONS }, allow_blank: true
  validates :category, presence: true

  scope :active, -> { where(archived_at: nil) }
  scope :archived, -> { where.not(archived_at: nil) }

  def archive!
    update!(archived_at: Time.current)
  end

  def unarchive!
    update!(archived_at: nil)
  end

  def archived?
    archived_at.present?
  end

  def as_json(_options = {})
    {
      id: id,
      name: name,
      icon: icon,
      category: category,
      archived_at: archived_at,
      plants_count: plants_count,
      created_at: created_at
    }
  end
end
