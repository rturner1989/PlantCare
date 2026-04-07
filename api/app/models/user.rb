# frozen_string_literal: true

class User < ApplicationRecord
  has_secure_password

  has_many :rooms, dependent: :destroy
  has_many :plants, through: :rooms
  has_many :refresh_tokens, dependent: :destroy

  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :name, presence: true
  validates :password, length: { minimum: 8 }, if: -> { new_record? || !password.nil? }

  before_save :downcase_email

  private

  def downcase_email
    self.email = email.downcase.strip
  end
end
