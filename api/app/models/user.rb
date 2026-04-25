# frozen_string_literal: true

# == Schema Information
#
# Table name: users
#
#  id                      :bigint           not null, primary key
#  email                   :string           not null
#  name                    :string           not null
#  onboarding_completed_at :datetime
#  onboarding_intent       :string
#  onboarding_step_reached :integer          default(0), not null
#  password_digest         :string           not null
#  timezone                :string           default("UTC")
#  created_at              :datetime         not null
#  updated_at              :datetime         not null
#
# Indexes
#
#  index_users_on_email  (email) UNIQUE
#
class User < ApplicationRecord
  has_secure_password

  # Onboarding intent — drives the R9 wizard branch (mockup 19) and downstream
  # behaviour (Today landing variant, notifications defaults, species filter,
  # streak prominence). Symbol keys are the canonical DB values; the strings
  # are user-facing labels rendered by the wizard's intent picker.
  USER_INTENT_LABELS = {
    forgetful: 'I keep forgetting',
    just_starting: "I'm just starting",
    sick_plant: 'My plant is sick',
    browsing: 'Just browsing'
  }.freeze

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

  has_many :spaces, dependent: :destroy
  has_many :plants, through: :spaces
  has_many :refresh_tokens, dependent: :destroy
  has_many :password_reset_tokens, dependent: :destroy

  # validate: { allow_nil: true } turns an invalid assignment into a 422 validation
  # error instead of the default ArgumentError that would surface as a 500. allow_nil
  # because nil is the meaningful "user hasn't picked yet" state — only out-of-list
  # strings (e.g. "garbage") should fail validation.
  enum :onboarding_intent, USER_INTENT_LABELS.keys.index_with(&:to_s), validate: { allow_nil: true }

  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :name, presence: true
  validates :onboarding_step_reached, numericality: { greater_than_or_equal_to: 0, only_integer: true }
  validates :password, length: { minimum: 8 }, if: -> { new_record? || !password.nil? }
  validate :password_composition, if: -> { password.present? }
  validate :password_not_common, if: -> { password.present? }

  before_save :downcase_email

  # Mirror of the downcase_email callback's normalization so lookups hit
  # rows that were saved through the normal path. Callers pass whatever
  # the user typed; we handle the stripping/case-folding.
  def self.find_by_normalized_email(email)
    find_by(email: email.to_s.downcase.strip)
  end

  def onboarded?
    onboarding_completed_at.present?
  end

  def complete_onboarding!
    return if onboarded?

    update!(onboarding_completed_at: Time.current)
  end

  def as_json(_options = {})
    {
      id: id,
      email: email,
      name: name,
      timezone: timezone,
      onboarded: onboarded?,
      onboarding_intent: onboarding_intent,
      onboarding_step_reached: onboarding_step_reached
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
