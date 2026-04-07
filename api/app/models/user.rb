# frozen_string_literal: true

# == Schema Information
#
# Table name: users
#
#  id              :bigint           not null, primary key
#  email           :string           not null
#  name            :string           not null
#  password_digest :string           not null
#  timezone        :string           default("UTC")
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#
# Indexes
#
#  index_users_on_email  (email) UNIQUE
#
class User < ApplicationRecord
  has_secure_password

  has_many :rooms, dependent: :destroy
  has_many :refresh_tokens, dependent: :destroy

  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :name, presence: true
  validates :password, length: { minimum: 8 }, if: -> { new_record? || !password.nil? }

  before_save :downcase_email

  def as_json(_options = {})
    {
      id: id,
      email: email,
      name: name,
      timezone: timezone
    }
  end

  private def downcase_email
    self.email = email.downcase.strip
  end
end
