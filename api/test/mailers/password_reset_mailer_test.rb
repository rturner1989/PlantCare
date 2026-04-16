# frozen_string_literal: true

require 'test_helper'

class PasswordResetMailerTest < ActionMailer::TestCase
  setup do
    @user = users(:john)
    @raw_token = 'example-raw-token-value'
  end

  test 'reset_instructions delivers to the user and includes a reset link with the raw token' do
    mail = PasswordResetMailer.reset_instructions(@user, @raw_token)

    assert_equal [@user.email], mail.to
    assert_match(/reset/i, mail.subject)
    assert_match(/#{@raw_token}/, mail.body.encoded)
    assert_match(/#{@raw_token}/, mail.text_part.body.encoded) if mail.text_part
    assert_match(%r{/reset-password/#{@raw_token}}, mail.body.encoded)
  end

  test 'reset link points at the frontend host, not the API host' do
    mail = PasswordResetMailer.reset_instructions(@user, @raw_token)
    # default_url_options in test env points at localhost:5173 matching dev.
    assert_match(%r{://localhost(:\d+)?/reset-password/}, mail.body.encoded)
  end
end
