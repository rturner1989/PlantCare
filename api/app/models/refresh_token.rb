# frozen_string_literal: true

# == Schema Information
#
# Table name: refresh_tokens
#
#  id           :bigint           not null, primary key
#  expires_at   :datetime         not null
#  revoked_at   :datetime
#  token_digest :string           not null
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  user_id      :bigint           not null
#
# Indexes
#
#  index_refresh_tokens_on_token_digest  (token_digest) UNIQUE
#  index_refresh_tokens_on_user_id       (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
class RefreshToken < ApplicationRecord
  belongs_to :user

  def self.generate(user, expires_in: 30.days)
    raw_token = SecureRandom.urlsafe_base64(32)
    refresh_token = user.refresh_tokens.create!(
      token_digest: Digest::SHA256.hexdigest(raw_token),
      expires_at: expires_in.from_now
    )

    [raw_token, refresh_token]
  end

  def self.find_by_raw_token(raw_token)
    return nil if raw_token.blank?

    digest = Digest::SHA256.hexdigest(raw_token)
    find_by(token_digest: digest)
  end

  def usable?
    revoked_at.nil? && expires_at > Time.current
  end

  def revoke!
    update!(revoked_at: Time.current)
  end
end
