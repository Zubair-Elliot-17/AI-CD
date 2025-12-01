import ansi from 'ansi-escape-sequences'
import DefaultView from '@test-runner/default-view'
import stringLength from 'string-length'

/**
 * Encapsulates how strings are styled, if at all.
 */
class StyledString {
  constructor (str, colour) {
    this.str = str
    this.colour = colour
  }
  toString () {
    if (this.colour) {
      return ansi.format(this.str, this.colour)
    } else {
      return this.str
    }
  }
}

class OnelineView extends DefaultView {
  constructor (options) {
    super(options)
    this.options.viewShowStarts = true
    this.firstLine = true
    this.fails = []
    this.contextDatas = []
  }

  start () {
    /* suppress start output */
  }

  testStart (test) {
    if (this.options.viewShowStarts) {
      const th = this.theme
      const parent = this.getParent(test)
      this.log(
        new StyledString('∙ ', th.groupDark),
        new StyledString(parent, th.groupDark),
        new StyledString(test.name, th.testDark),
      )
    }
  }

  testPass (test) {
    const th = this.theme
    const parent = this.getParent(test)
    const result = test.result === undefined ? '' : ` [${test.result}]`
    const duration = test.stats.duration.toFixed(1) + 'ms'
    this.log(
      new StyledString('✓ ', th.pass),
      new StyledString(parent, th.group),
      new StyledString(test.name),
      new StyledString(result)
    )
    if (test.context.data) {
      this.contextData(test)
    }
  }

  contextData (test) {
    this.contextDatas.push(test)
  }

  testFail (test, err) {
    const parent = this.getParent(test)
    const strParts = [
      new StyledString('⨯ ', this.theme.fail),
      new StyledString(parent, this.theme.group),
      new StyledString(test.name)
    ]
    this.log(...strParts)
    this.fails.push(strParts.join(''))
    const lines = this.getErrorMessage(err).split('\n').map(line => {
      return '  ' + line
    })
    this.fails.push('', ...lines, '')
  }

  getErrorMessage (err) {
    if (this.options.viewHideErrStack) {
      return err.message
    } else {
      return err.stack
    }
  }

  testSkip (test) {
    if (!this.options.viewHideSkips) {
      const th = this.theme
      const parent = this.getParent(test)
      this.log(
        new StyledString('- ', th.skip),
        new StyledString(parent, th.skip),
        new StyledString(test.name, th.skip)
      )
    }
  }

  testTodo (test) {
    if (!this.options.viewHideSkips) {
      const th = this.theme
      const parent = this.getParent(test);
      this.log(
        new StyledString('- ', th.todo),
        new StyledString(parent, th.todo),
        new StyledString(test.name, th.todo)
      )
    }
  }

  /**
   * @params {object} stats
   * @params {object} stats.fail
   * @params {object} stats.pass
   * @params {object} stats.skip
   * @params {object} stats.start
   * @params {object} stats.end
   */
  end (stats) {
    this.log(new StyledString(`Completed in ${stats.timeElapsed()}ms.`))
    if (this.fails.length) {
      console.log()
      console.log(this.fails.join('\n'))
    }
    if (this.contextDatas.length) {
      if (typeof window === 'undefined') {
        for (const test of this.contextDatas) {
          const str = this.inspect(test.context.data)
          const data = str
          console.log(`Context data: ${test.name}`)
          console.log(`${data.trimEnd()}\n`)
        }
      }
    }
  }

  log (...args) {
    if (!this.firstLine) {
      process.stdout.write(ansi.cursor.up(1) + ansi.erase.inLine(2))
    }
    const th = this.theme

    const stats = this.runner ? this.runner.stats : {}
    const colour = {
      fail: stats.fail > 0 ? th.fail : th.plain,
      pass: stats.pass > 0 ? th.pass : th.plain,
      skip: stats.skip > 0 ? th.skip : th.plain,
      todo: stats.todo > 0 ? th.todo : th.plain,
      inProgress: stats.inProgress > 0 ? th.inProgress : th.plain,
    }

    const statsSummaryElements = []
    statsSummaryElements.push(`In-progress: [${colour.inProgress}]{${stats.inProgress}}`)
    statsSummaryElements.push(`pass: [${colour.pass}]{${stats.pass}}`)
    statsSummaryElements.push(`fail: [${colour.fail}]{${stats.fail}}`)
    if (stats.skip) {
      statsSummaryElements.push(`skip: [${colour.skip}]{${stats.skip}}`)
    }
    if (stats.todo) {
      statsSummaryElements.push(`todo: [${colour.todo}]{${stats.todo}}`)
    }
    const statsSummary = ansi.format(statsSummaryElements.join(', ')) + '. '
    const formattedMsg = args.join('')
    const unformattedMsg = args
      .map(styledString => {
        return new StyledString(styledString.str, null)
      })
      .join('')
    const formattedLine = statsSummary + formattedMsg
    if (stringLength(formattedLine) > process.stdout.columns) {
      const spaceAvailable = process.stdout.columns - stringLength(statsSummary)
      console.log(statsSummary + unformattedMsg.substr(0, spaceAvailable))
    } else {
      console.log(formattedLine)
    }
    this.firstLine = false
  }

  static optionDefinitions () {
    return []
  }
}

export default OnelineView
