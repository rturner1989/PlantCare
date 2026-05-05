# frozen_string_literal: true

module Api
  module V1
    class WeatherController < BaseController
      CACHE_TTL = 30.minutes

      # Test seam — Minitest 6 dropped Object#stub, so we expose the
      # client as a class-level dep that tests can swap for a fake.
      class << self
        attr_writer :client_class

        def client_class
          @client_class ||= OpenMeteoClient
        end
      end

      def show
        location = current_user.weather_location
        cache_key = "weather:#{location[:latitude].round(2)}:#{location[:longitude].round(2)}:v2"

        payload = Rails.cache.fetch(cache_key, expires_in: CACHE_TTL) do
          self.class.client_class.forecast(latitude: location[:latitude], longitude: location[:longitude])
        end

        if payload
          render json: payload.merge(location_label: location[:label])
        else
          render json: { error: 'Weather unavailable' }, status: :bad_gateway
        end
      end
    end
  end
end
