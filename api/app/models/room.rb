# frozen_string_literal: true

# == Schema Information
#
# Table name: rooms
#
#  id         :bigint           not null, primary key
#  icon       :string
#  name       :string           not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  user_id    :bigint           not null
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
  belongs_to :user
  has_many :plants, dependent: :destroy

  validates :name, presence: true

  def as_json(_options = {})
    {
      id: id,
      name: name,
      icon: icon,
      plants_count: plants.size,
      created_at: created_at
    }
  end
end
