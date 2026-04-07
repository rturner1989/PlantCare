# frozen_string_literal: true

class JwtToken
  SECRET = ENV.fetch('JWT_SECRET')

  def self.encode(payload, expires_in: 15.minutes)
    payload = payload.dup
    payload[:exp] = expires_in.from_now.to_i

    JWT.encode(payload, SECRET, 'HS256')
  end

  def self.decode(token)
    decoded = JWT.decode(token, SECRET, true, algorithm: 'HS256')
    decoded.first.symbolize_keys
  rescue JWT::DecodeError
    nil
  end
end
