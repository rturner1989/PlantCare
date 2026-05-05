# frozen_string_literal: true

require 'test_helper'

class AchievementsChannelTest < ActionCable::Channel::TestCase
  test 'streams for the connected user only' do
    user = users(:john)
    stub_connection current_user: user

    subscribe
    assert subscription.confirmed?
    assert_has_stream_for user
  end

  test 'unlock broadcasts to the recipient stream' do
    user = users(:john)
    other_user = users(:jane)
    Achievement.where(user: user).destroy_all

    stub_connection current_user: user
    subscribe

    user_stream = AchievementsChannel.broadcasting_for(user)
    other_stream = AchievementsChannel.broadcasting_for(other_user)

    assert_broadcasts(user_stream, 1) do
      Achievement.unlock!(user: user, kind: 'first_plant')
    end

    assert_no_broadcasts(other_stream)
  end
end
