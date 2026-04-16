# frozen_string_literal: true

class PasswordResetMailer < ApplicationMailer
  # The raw token is handed in from the controller — never pulled from the
  # persisted record, which only has the digest. It ends up in the URL that
  # the user clicks; the recipient copy is the only place it exists outside
  # of memory.
  def reset_instructions(user, raw_token)
    @user = user
    @reset_url = build_reset_url(raw_token)

    # rubocop:disable Rails/I18nLocaleTexts
    # Single-locale app for now; revisit when i18n lands.
    mail(to: @user.email, subject: 'Reset your PlantCare password')
    # rubocop:enable Rails/I18nLocaleTexts
  end

  private def build_reset_url(raw_token)
    opts = ActionMailer::Base.default_url_options
    protocol = opts[:protocol] || 'http'
    port = opts[:port] ? ":#{opts[:port]}" : ''
    host = opts[:host] || 'localhost'
    "#{protocol}://#{host}#{port}/reset-password/#{raw_token}"
  end
end
