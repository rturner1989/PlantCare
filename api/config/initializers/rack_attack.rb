# frozen_string_literal: true

Rack::Attack.cache.store = Rails.cache

# Default off under test so only the specific throttling tests exercise it,
# and the rest don't have to count requests to stay under the limit.
Rack::Attack.enabled = false if Rails.env.test?

Rack::Attack.throttle('password_resets/ip', limit: 10, period: 1.hour) do |req|
  req.ip if req.post? && req.path == '/api/v1/password_resets'
end

Rack::Attack.throttle('password_resets/email', limit: 3, period: 1.hour) do |req|
  next unless req.post? && req.path == '/api/v1/password_resets'

  body = req.body.read
  req.body.rewind
  next if body.blank?

  parsed = begin
    JSON.parse(body)
  rescue JSON::ParserError
    nil
  end
  parsed&.dig('password_reset', 'email').to_s.downcase.strip.presence
end

Rack::Attack.throttled_responder = lambda do |_request|
  [
    429,
    { 'Content-Type' => 'application/json' },
    [{ error: 'Too many requests, please try again later.' }.to_json]
  ]
end
