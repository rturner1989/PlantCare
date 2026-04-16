# frozen_string_literal: true

module Api
  module V1
    module Rooms
      class PresetsController < Api::V1::BaseController
        def index
          render json: Room::PRESETS
        end
      end
    end
  end
end
