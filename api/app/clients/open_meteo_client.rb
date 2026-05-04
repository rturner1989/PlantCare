# frozen_string_literal: true

# Open-Meteo HTTP client. No API key required — Open-Meteo is free for
# non-commercial use up to 10k calls/day on the hosted endpoint.
#
# Phase 1 surfaces:
#   - current weather (temperature, weather_code → label)
#   - 7-day daily forecast (max temp, weather_code, precipitation)
#
# Cached at the controller layer (30 min TTL) — coordinates round to
# 2 decimals so nearby callers share a cache slot without hitting the
# upstream API on every request.
#
# WMO weather codes → human label + scheme + emoji icon mapping.
# https://open-meteo.com/en/docs#weather_code-table
class OpenMeteoClient
  BASE_URL = 'https://api.open-meteo.com/v1'

  # icon_name maps to a FontAwesome icon on the client (Solid set). Emoji
  # is kept as a fallback / sr-friendly hint in the week-row variant.
  WEATHER_CODES = {
    0 => { label: 'Clear', scheme: 'heat', icon: '☀', icon_name: 'sun' },
    1 => { label: 'Mainly clear', scheme: 'heat', icon: '🌤', icon_name: 'cloud-sun' },
    2 => { label: 'Partly cloudy', scheme: 'sky', icon: '⛅', icon_name: 'cloud-sun' },
    3 => { label: 'Overcast', scheme: 'sky', icon: '☁', icon_name: 'cloud' },
    45 => { label: 'Fog', scheme: 'frost', icon: '🌫', icon_name: 'smog' },
    48 => { label: 'Rime fog', scheme: 'frost', icon: '🌫', icon_name: 'smog' },
    51 => { label: 'Light drizzle', scheme: 'sky', icon: '🌦', icon_name: 'cloud-rain' },
    53 => { label: 'Drizzle', scheme: 'sky', icon: '🌦', icon_name: 'cloud-rain' },
    55 => { label: 'Heavy drizzle', scheme: 'sky', icon: '🌧', icon_name: 'cloud-showers-heavy' },
    61 => { label: 'Light rain', scheme: 'sky', icon: '🌦', icon_name: 'cloud-rain' },
    63 => { label: 'Rain', scheme: 'sky', icon: '🌧', icon_name: 'cloud-showers-heavy' },
    65 => { label: 'Heavy rain', scheme: 'sky', icon: '🌧', icon_name: 'cloud-showers-heavy' },
    71 => { label: 'Light snow', scheme: 'frost', icon: '🌨', icon_name: 'snowflake' },
    73 => { label: 'Snow', scheme: 'frost', icon: '🌨', icon_name: 'snowflake' },
    75 => { label: 'Heavy snow', scheme: 'frost', icon: '❄', icon_name: 'snowflake' },
    77 => { label: 'Snow grains', scheme: 'frost', icon: '❄', icon_name: 'snowflake' },
    80 => { label: 'Showers', scheme: 'sky', icon: '🌦', icon_name: 'cloud-rain' },
    81 => { label: 'Heavy showers', scheme: 'sky', icon: '🌧', icon_name: 'cloud-showers-heavy' },
    82 => { label: 'Violent showers', scheme: 'sky', icon: '⛈', icon_name: 'cloud-bolt' },
    85 => { label: 'Snow showers', scheme: 'frost', icon: '🌨', icon_name: 'snowflake' },
    86 => { label: 'Heavy snow showers', scheme: 'frost', icon: '❄', icon_name: 'snowflake' },
    95 => { label: 'Thunderstorm', scheme: 'sky', icon: '⛈', icon_name: 'cloud-bolt' },
    96 => { label: 'Thunderstorm + hail', scheme: 'sky', icon: '⛈', icon_name: 'cloud-bolt' },
    99 => { label: 'Severe thunderstorm', scheme: 'sky', icon: '⛈', icon_name: 'cloud-bolt' }
  }.freeze
  UNKNOWN_CODE = { label: 'Unknown', scheme: 'sky', icon: '❓', icon_name: 'question' }.freeze

  # Class-method shorthand so controllers can call `OpenMeteoClient.forecast(...)`
  # without managing instances. Tests stub this class method directly.
  def self.forecast(latitude:, longitude:)
    new.forecast(latitude: latitude, longitude: longitude)
  end

  def initialize(connection: nil)
    @conn = connection || build_connection
  end

  def forecast(latitude:, longitude:)
    response = @conn.get('forecast', forecast_params(latitude, longitude))
    body = response.body
    {
      today: today_payload(body),
      week: week_payload(body)
    }
  rescue Faraday::Error => e
    Rails.logger.error("Open-Meteo forecast failed: #{e.message}")
    nil
  end

  private def build_connection
    Faraday.new(url: BASE_URL) do |f|
      f.response :json
      f.response :raise_error
    end
  end

  private def forecast_params(latitude, longitude)
    {
      latitude: latitude,
      longitude: longitude,
      current: 'temperature_2m,weather_code',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max',
      timezone: 'auto',
      forecast_days: 7
    }
  end

  private def today_payload(body)
    current = body['current'] || {}
    daily = body['daily'] || {}
    code = WEATHER_CODES.fetch(current['weather_code'], UNKNOWN_CODE)
    temp = current['temperature_2m']
    overnight = daily.dig('temperature_2m_min', 0)
    rain_prob = daily.dig('precipitation_probability_max', 0)
    rain_sum = daily.dig('precipitation_sum', 0)
    high = daily.dig('temperature_2m_max', 0)

    {
      scheme: code[:scheme],
      icon: code[:icon],
      icon_name: code[:icon_name],
      label: code[:label],
      temperature: temp&.round,
      detail: temp ? "#{temp.round}° · #{code[:label].downcase}" : code[:label],
      overnight_low: overnight&.round,
      rain_probability: rain_prob,
      next_day: next_day_payload(daily),
      advice: plant_care_advice(code, temp, high, rain_prob, rain_sum)
    }
  end

  private def next_day_payload(daily)
    code = WEATHER_CODES.fetch(daily.dig('weather_code', 1), UNKNOWN_CODE)
    high = daily.dig('temperature_2m_max', 1)
    {
      label: code[:label],
      icon: code[:icon],
      icon_name: code[:icon_name],
      scheme: code[:scheme],
      temperature: high&.round,
      rain_probability: daily.dig('precipitation_probability_max', 1)
    }
  end

  # Rule-based plant-care advice. Order matters — first match wins.
  # Rain trumps everything; cold trumps heat; warm-dry only kicks in
  # when nothing more pressing applies. Always returns SOMETHING so the
  # advice line is never empty on the strip.
  private def plant_care_advice(code, _temp, high, rain_prob, rain_sum)
    return 'Rain forecast — outdoor watering can skip.' if rain_prob && rain_prob >= 60
    return 'Wet day — check drainage on outdoor pots.' if rain_sum && rain_sum >= 10
    return 'Cold day — bring tender plants in if you can.' if high && high < 5
    return 'Hot day — soil dries fast, check moisture twice.' if high && high >= 28
    return 'Bright day — outdoor plants will need your help.' if code[:scheme] == 'heat' && high && high >= 18
    return 'Mild day — give your indoor plants a quick check.' if high && high >= 12

    'A calm day — your plants are happy.'
  end

  private def week_payload(body)
    daily = body['daily'] || {}
    times = daily['time'] || []
    codes = daily['weather_code'] || []
    highs = daily['temperature_2m_max'] || []
    times.each_with_index.map do |date, index|
      code = WEATHER_CODES.fetch(codes[index], UNKNOWN_CODE)
      {
        date: date,
        scheme: code[:scheme],
        icon: code[:icon],
        icon_name: code[:icon_name],
        label: code[:label],
        temperature: highs[index]&.round
      }
    end
  end
end
