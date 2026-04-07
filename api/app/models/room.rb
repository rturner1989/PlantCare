# frozen_string_literal: true

class Room < ApplicationRecord
  belongs_to :user

  validates :name, presence: true

  def as_json(_options = {})
    {
      id: id,
      name: name,
      icon: icon,
      created_at: created_at
    }
  end
end
