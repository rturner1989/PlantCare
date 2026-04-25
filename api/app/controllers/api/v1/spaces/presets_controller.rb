# frozen_string_literal: true

module Api
  module V1
    module Spaces
      class PresetsController < Api::V1::BaseController
        def index
          render json: Space::PRESETS
        end
      end
    end
  end
end
