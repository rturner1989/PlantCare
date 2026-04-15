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

  # Common passwords that satisfy the length + letter + digit rules but are
  # still trivially guessable. Stored in a Set for O(1) lookup and compared
  # case-insensitively (downcased input against downcased entries). Not
  # exhaustive — just the handful that would otherwise slip past our other
  # rules. Extend as we see abuse.
  COMMON_PASSWORDS = Set[
    'password1', 'password12', 'password123', 'password1234',
    'qwerty123', 'qwerty1234', 'qwertyuiop',
    'welcome1', 'welcome123', 'letmein1', 'letmein123',
    'admin123', 'administrator1',
    'iloveyou1', 'iloveyou123',
    'monkey123', 'dragon123', 'master123', 'shadow123',
    'superman1', 'batman123', 'football1', 'baseball1',
    'princess1', 'sunshine1', 'trustno1',
    'zaq12wsx', '1qaz2wsx', 'qazwsx123', 'asdf1234',
    'p@ssword1', 'passw0rd1', 'passw0rd123',
    'changeme1'
  ].freeze
  private_constant :COMMON_PASSWORDS

  has_many :rooms, dependent: :destroy
  has_many :plants, through: :rooms
  has_many :refresh_tokens, dependent: :destroy

  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :name, presence: true
  validates :password, length: { minimum: 8 }, if: -> { new_record? || !password.nil? }
  validate :password_composition, if: -> { password.present? }
  validate :password_not_common, if: -> { password.present? }

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

  # Password must contain at least one letter and at least one digit.
  # Two separate errors so the user sees which piece is missing, not a
  # vague "too weak". Symbols route to the locale file for wording.
  private def password_composition
    errors.add(:password, :missing_letter) unless password.match?(/[A-Za-z]/)
    errors.add(:password, :missing_digit) unless password.match?(/\d/)
  end

  private def password_not_common
    errors.add(:password, :too_common) if COMMON_PASSWORDS.include?(password.downcase)
  end
end
