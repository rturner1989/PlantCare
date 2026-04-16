# frozen_string_literal: true

# == Schema Information
#
# Table name: rooms
#
#  id           :bigint           not null, primary key
#  icon         :string
#  name         :string           not null
#  plants_count :integer          default(0), not null
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  user_id      :bigint           not null
#
# Indexes
#
#  index_rooms_on_user_id  (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
class Room < ApplicationRecord
  ICONS = %w[couch kitchen bed bath desk].freeze

  PRESETS = [
    { name: 'Living Room', icon: 'couch' },
    { name: 'Kitchen', icon: 'kitchen' },
    { name: 'Bedroom', icon: 'bed' },
    { name: 'Bathroom', icon: 'bath' },
    { name: 'Office', icon: 'desk' }
  ].freeze

  belongs_to :user
  has_many :plants, dependent: :destroy

  # TODO: add a matching unique expression index on (user_id, LOWER(name))
  # once duplicate rows from pre-validation testing have been cleared out
  # of the dev DB. The model check catches the common case; the index is
  # needed to close the race where two concurrent creates pass validation
  # before either commits. See the migration that was removed on
  # 2026-04-16 for the intended CREATE UNIQUE INDEX form.
  # rubocop:disable Rails/UniqueValidationWithoutIndex
  validates :name, presence: true, uniqueness: { scope: :user_id, case_sensitive: false }
  # rubocop:enable Rails/UniqueValidationWithoutIndex
  validates :icon, inclusion: { in: ICONS }, allow_blank: true

  def as_json(_options = {})
    {
      id: id,
      name: name,
      icon: icon,
      plants_count: plants_count,
      created_at: created_at
    }
  end
end
